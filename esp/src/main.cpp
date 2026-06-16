#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ArduinoOTA.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_ADS1X15.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>
#include <math.h>

#include "config.h"
#include "sensors.h"
#include "mqtt.h"
#include "buttons.h"
#include "display.h"

// Night mode dims the OLED to near-invisible — disabled for now while
// bringing up hardware. Set to 1 to re-enable.
#define ENABLE_NIGHT_MODE 0

// ── Hardware objects ──────────────────────────────────────────────────────────

static WiFiClient            wifiClient;
static PubSubClient          mqttClient(wifiClient);
static DHT                   dht(PIN_DHT11, DHT11);
static Adafruit_SSD1306      oled(128, 64, &Wire, -1);
static Adafruit_ADS1115      ads;
static WiFiUDP               ntpUDP;
static NTPClient             ntp(ntpUDP, "pool.ntp.org", -10800, 60000); // UTC-3 (Brasília)

// ── Runtime state ─────────────────────────────────────────────────────────────

static ButtonState btn1 = {};
static ButtonState btn2 = {};

static char  plantState[16]  = "happy";
static bool  oledOn          = true;

static unsigned long bootTime       = 0;
static unsigned long lastReadAt     = 0;
static unsigned long lastEventAt    = 0;
static unsigned long lastMqttAttempt = 0;
static const unsigned long MQTT_RETRY_MS = 5000;

static int   lastSoil    = 0;
static int   lastSoilRaw = 0;
static int   lastTemp = 0;
static int   lastLux  = 0;
static int   lastHum  = 0;
static bool  dhtOk    = false;

// ── Display rendering ─────────────────────────────────────────────────────────

static void renderNormal(int soil, int temp, int lux) {
    static const char* const exprSymbols[] = { ":)", ":(", ">.<", "-_-", ">_<", "zzz" };

    oled.dim(false);
    oled.clearDisplay();

    // Tamagotchi expression — left side, large
    TamagotchiExpr expr = stateToExpression(plantState);
    oled.setTextSize(2);
    oled.setCursor(0, 10);
    oled.print(exprSymbols[expr]);

    // Three vertical sensor bars — right side (soil / temp / lux)
    int soilPx = sensorBarHeight(soil, 0,   100,  40);
    int tempPx = sensorBarHeight(temp, 0,   40,   40);
    int luxPx  = sensorBarHeight(lux,  0,   1000, 40);
    oled.fillRect(88,  40 - soilPx, 10, soilPx, SSD1306_WHITE);
    oled.fillRect(102, 40 - tempPx, 10, tempPx, SSD1306_WHITE);
    oled.fillRect(116, 40 - luxPx,  10, luxPx,  SSD1306_WHITE);

    // Bar labels
    oled.setTextSize(1);
    oled.setCursor(88,  52); oled.print("S");
    oled.setCursor(102, 52); oled.print("T");
    oled.setCursor(116, 52); oled.print("L");

    // Footer message
    oled.setCursor(0, 56);
    oled.print(stateToFooter(plantState));

    // Show raw DHT11 reading and soil ADC value so they're visible
    // without a serial monitor.
    oled.setCursor(40, 0);
    if (dhtOk) {
        oled.print("DHT ");
        oled.print(lastTemp);
        oled.print((char)247);
        oled.print("C ");
        oled.print(lastHum);
        oled.print("%");
    } else {
        oled.print("DHT ERR");
    }
    oled.setCursor(40, 8);
    oled.print("Soil raw:");
    oled.print(lastSoilRaw);

    oled.display();
}

static void renderNight() {
    oled.clearDisplay();
    oled.dim(true);
    oled.setTextSize(2);
    oled.setCursor(20, 20);
    // NTPClient returns "HH:MM:SS" — show only HH:MM
    String t = ntp.getFormattedTime();
    oled.print(t.substring(0, 5));
    oled.setTextSize(1);
    oled.setCursor(50, 48);
    oled.print("zzz");
    oled.display();
}

static void updateDisplay() {
    int  hour     = (int)ntp.getHours();
    // NTP not synced yet ⇒ epoch is still near 0 (time since boot).
    // Don't treat that as midnight/night mode.
    bool ntpReady = ntp.getEpochTime() > 1000000000UL;
    bool night    = ENABLE_NIGHT_MODE && ntpReady && isNightHour(hour);
    bool timedOut = isEconomyTimedOut(lastEventAt, millis(), ECONOMY_TIMEOUT_MS);

    if (night) {
        if (!oledOn) { oled.ssd1306_command(SSD1306_DISPLAYON); oledOn = true; }
        renderNight();
    } else if (timedOut) {
        if (oledOn) { oled.ssd1306_command(SSD1306_DISPLAYOFF); oledOn = false; }
    } else {
        if (!oledOn) {
            oled.ssd1306_command(SSD1306_DISPLAYON);
            oled.dim(false);
            oledOn = true;
        }
        renderNormal(lastSoil, lastTemp, lastLux);
    }
}

// ── MQTT ──────────────────────────────────────────────────────────────────────

static void onMessage(char* topic, byte* payload, unsigned int len) {
    char buf[128];
    if (len >= sizeof(buf)) return;
    memcpy(buf, payload, len);
    buf[len] = '\0';

    StaticJsonDocument<128> doc;
    if (deserializeJson(doc, buf) != DeserializationError::Ok) return;

    if (strcmp(topic, "plant/state") == 0) {
        const char* s = doc["state"] | "happy";
        strncpy(plantState, s, sizeof(plantState) - 1);
        plantState[sizeof(plantState) - 1] = '\0';
        lastEventAt = millis();

    } else if (strcmp(topic, "plant/alerts") == 0) {
        // No buzzer installed — an alert just wakes the display.
        lastEventAt = millis();
    }
}

// Single, non-blocking connection attempt — returns true on success.
// Retried periodically from loop() so a missing broker never blocks setup().
static bool connectMqtt() {
    if (mqttClient.connect(MQTT_CLIENT)) {
        mqttClient.subscribe("plant/state");
        mqttClient.subscribe("plant/alerts");
        mqttClient.subscribe("plant/commands");
        Serial.println("MQTT connected");
        return true;
    }
    Serial.println("MQTT connect failed");
    return false;
}

// ── Sensor read + publish ─────────────────────────────────────────────────────

static void readAndPublish() {
    unsigned long now = millis();
    char topic[48];
    char payload[96];

    // DHT11 — temperature and humidity
    float temp     = dht.readTemperature();
    float humidity = dht.readHumidity();
    dhtOk = !isnan(temp) && !isnan(humidity);
    if (dhtOk) {
        buildTopic(topic, sizeof(topic), "dht11");
        buildPayloadDht11(payload, sizeof(payload), (int)temp, (int)humidity);
        mqttClient.publish(topic, payload);
        lastTemp = (int)temp;
        lastHum  = (int)humidity;
    }

    // Soil moisture (HL-69) — analog via ADS1115
    int soilRaw  = adsToRaw10(ads.readADC_SingleEnded(ADS_CH_SOIL));
    int moisture = soilMoisturePercent(soilRaw);
    buildTopic(topic, sizeof(topic), "soil");
    buildPayloadSoil(payload, sizeof(payload), moisture);
    mqttClient.publish(topic, payload);
    lastSoil    = moisture;
    lastSoilRaw = soilRaw;

    // LDR — single light sensor on the ADS1115 (real lux, 0–1000).
    int lux = ldrLux(adsToRaw10(ads.readADC_SingleEnded(ADS_CH_LDR)));
    buildTopic(topic, sizeof(topic), "ldr");
    buildPayloadLdr(payload, sizeof(payload), lux);
    mqttClient.publish(topic, payload);
    lastLux = lux;

    // Rain sensor (LOW = rain detected on most modules)
    bool rain = digitalRead(PIN_RAIN) == LOW;
    buildTopic(topic, sizeof(topic), "rain");
    buildPayloadRain(payload, sizeof(payload), rain);
    mqttClient.publish(topic, payload);

    // MQ135 — air quality, real ppm via ADS1115, only after warm-up
    if (isMq135Ready(now, bootTime)) {
        int ppm = mq135Ppm(adsToRaw10(ads.readADC_SingleEnded(ADS_CH_MQ135)));
        buildTopic(topic, sizeof(topic), "mq135");
        buildPayloadMq135(payload, sizeof(payload), ppm);
        mqttClient.publish(topic, payload);
    }

    updateDisplay();
}

// ── Button actions ────────────────────────────────────────────────────────────

static void handleBtn1Short() {
    Serial.println("BTN1 short press");
    // Wake display if off, otherwise just reset the economy timer
    lastEventAt = millis();
    if (!oledOn) {
        oled.ssd1306_command(SSD1306_DISPLAYON);
        oled.dim(false);
        oledOn = true;
    }
}

static void handleBtn2Short() {
    unsigned long epoch = ntp.getEpochTime();
    char topic[48], payload[80];
    buildTopic(topic, sizeof(topic), "commands");
    buildPayloadCommand(payload, sizeof(payload), "manual_watering", epoch);
    mqttClient.publish(topic, payload);
    lastEventAt = millis();
    Serial.println("Manual watering logged");
}

// ── setup ─────────────────────────────────────────────────────────────────────

void setup() {
    Serial.begin(115200);
    bootTime    = millis();
    lastEventAt = bootTime;

    // Pin modes
    pinMode(PIN_BTN1, INPUT);
    pinMode(PIN_BTN2, INPUT);
    pinMode(PIN_RAIN, INPUT);

    // OLED — initialize first so we get visual feedback even if
    // Wi-Fi/MQTT never connect.
    Wire.begin();
    if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("SSD1306 not found — check wiring");
    }
    if (!ads.begin(ADS_ADDR)) {
        Serial.println("ADS1115 not found — check wiring");
    }
    oled.clearDisplay();
    oled.setTextColor(SSD1306_WHITE);
    oled.setTextSize(1);
    oled.setCursor(0, 0);
    oled.println("Smart Plant");
    oled.println("Booting...");
    oled.println("WiFi...");
    oled.display();

    WiFi.mode(WIFI_STA);

    // Wi-Fi — best-effort, 20s timeout (keeps going without it),
    // showing the live wl_status_t code on screen while it tries.
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("WiFi connecting");
    unsigned long wifiStart = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - wifiStart < 20000) {
        Serial.print(".");
        oled.clearDisplay();
        oled.setCursor(0, 0);
        oled.println("WiFi connecting");
        oled.print("status=");
        oled.println((int)WiFi.status());
        oled.display();
        delay(500);
    }
    bool wifiOk = WiFi.status() == WL_CONNECTED;
    Serial.println(wifiOk ? (" OK — " + WiFi.localIP().toString()) : " timeout");
    oled.println(wifiOk ? "WiFi: OK" : "WiFi: offline");
    oled.display();

    // OTA — wireless firmware updates (first flash must still be via USB)
    ArduinoOTA.setHostname(OTA_HOSTNAME);
    ArduinoOTA.setPassword(OTA_PASSWORD);
    ArduinoOTA.onStart([]() {
        ESP.wdtDisable();
        oled.clearDisplay();
        oled.setTextSize(1);
        oled.setCursor(0, 28);
        oled.print("OTA update...");
        oled.display();
    });
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        ESP.wdtFeed();
    });
    ArduinoOTA.begin();

    // MQTT — best-effort single attempt, retried later from loop()
    mqttClient.setServer(MQTT_HOST, MQTT_PORT);
    mqttClient.setCallback(onMessage);
    bool mqttOk = wifiOk && connectMqtt();
    lastMqttAttempt = millis();
    oled.println(mqttOk ? "MQTT: OK" : "MQTT: offline");
    oled.display();

    // NTP
    if (wifiOk) {
        ntp.begin();
        ntp.update();
    }

    // Sensors
    dht.begin();

    delay(1000);
    oled.clearDisplay();
    oled.setCursor(0, 28);
    oled.print("Smart Plant ready");
    oled.display();

    // Reset the economy-mode timer now that the (lengthy, diagnostic-heavy)
    // boot sequence is done, so the display stays on for a full
    // ECONOMY_TIMEOUT_MS after setup finishes.
    lastEventAt = millis();

    // Watchdog — restart if loop hangs for more than 8s
    ESP.wdtEnable(8000);

    Serial.println("Setup complete");
}

// ── loop ──────────────────────────────────────────────────────────────────────

void loop() {
    unsigned long now = millis();
    ESP.wdtFeed();
    ArduinoOTA.handle();

    // Reconnect Wi-Fi if dropped
    if (WiFi.status() != WL_CONNECTED) {
        Serial.print("WiFi lost, reconnecting");
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        oled.clearDisplay();
        oled.setTextSize(1);
        oled.setCursor(0, 0);
        oled.println("WiFi reconnecting");
        oled.print("status=");
        oled.println((int)WiFi.status());
        oled.display();
        delay(500);
        return;
    }

    // Reconnect MQTT if dropped (retried every MQTT_RETRY_MS, non-blocking)
    if (!mqttClient.connected()) {
        if (now - lastMqttAttempt >= MQTT_RETRY_MS) {
            lastMqttAttempt = now;
            connectMqtt();
        }
    } else {
        mqttClient.loop();
    }

    // NTP sync (non-blocking; NTPClient internally throttles)
    ntp.update();

    // Print raw sensor/pin states once a second so wiring can be checked
    // without watching the OLED.
    {
        static unsigned long lastDebugAt = 0;
        if (now - lastDebugAt >= 1000) {
            lastDebugAt = now;
            Serial.print("BTN1=");
            Serial.print(digitalRead(PIN_BTN1));
            Serial.print(" BTN2=");
            Serial.print(digitalRead(PIN_BTN2));
            Serial.print(" oledOn=");
            Serial.print(oledOn);
            Serial.print(" SOIL=");
            Serial.print(ads.readADC_SingleEnded(ADS_CH_SOIL));
            Serial.print(" LDR=");
            Serial.print(ads.readADC_SingleEnded(ADS_CH_LDR));
            Serial.print(" RAIN=");
            Serial.print(digitalRead(PIN_RAIN));
            Serial.print(" MQ135=");
            Serial.println(ads.readADC_SingleEnded(ADS_CH_MQ135));
        }
    }

    // Buttons — BTN1 wakes/refreshes the display; BTN2 logs manual watering.
    if (buttonTick(btn1, digitalRead(PIN_BTN1) == HIGH, now) == BTN_SHORT_PRESS) {
        handleBtn1Short();
    }
    if (buttonTick(btn2, digitalRead(PIN_BTN2) == HIGH, now) == BTN_SHORT_PRESS) {
        handleBtn2Short();
    }

    // Economy display check (runs every loop, not just on sensor reads)
    if (isEconomyTimedOut(lastEventAt, now, ECONOMY_TIMEOUT_MS) &&
        oledOn && !isNightHour((int)ntp.getHours())) {
        oled.ssd1306_command(SSD1306_DISPLAYOFF);
        oledOn = false;
    }

    // Sensor read + publish every READING_INTERVAL
    if (now - lastReadAt >= READING_INTERVAL) {
        lastReadAt = now;
        readAndPublish();
    }
}
