#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Adafruit_BMP085_U.h>
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ArduinoJson.h>
#include <math.h>

#include "config.h"
#include "sensors.h"
#include "mqtt.h"
#include "leds.h"
#include "buttons.h"
#include "display.h"

// ── Hardware objects ──────────────────────────────────────────────────────────

static WiFiClient            wifiClient;
static PubSubClient          mqttClient(wifiClient);
static DHT                   dht(PIN_DHT11, DHT11);
static Adafruit_BMP085_Unified bmp(10085);
static Adafruit_SSD1306      oled(128, 64, &Wire, -1);
static WiFiUDP               ntpUDP;
static NTPClient             ntp(ntpUDP, "pool.ntp.org", 0, 60000);

// ── Runtime state ─────────────────────────────────────────────────────────────

static ButtonState btn1 = {};
static ButtonState btn2 = {};

static char  plantState[16]  = "happy";
static bool  buzzerMuted     = false;
static bool  oledOn          = true;

static unsigned long bootTime    = 0;
static unsigned long lastReadAt  = 0;
static unsigned long lastEventAt = 0;

static int   lastSoil = 0;
static int   lastTemp = 0;
static int   lastLux  = 0;

// ── Shift register ────────────────────────────────────────────────────────────

// Two chained 74HC595:
//   byte1 (sent first, ends up in second register): soil bar — bits 4:0 = segments
//   byte2 (sent second, ends up in first register): LEDs — bits 7:5 = RGB1, 4:2 = RGB2
static void shiftOut2(byte leds, byte bar) {
    digitalWrite(PIN_SR_LATCH, LOW);
    shiftOut(PIN_SR_DATA, PIN_SR_CLK, MSBFIRST, bar);
    shiftOut(PIN_SR_DATA, PIN_SR_CLK, MSBFIRST, leds);
    digitalWrite(PIN_SR_LATCH, HIGH);
}

// Encode a LedColor into 3 bits (R G B) for the shift register byte.
static byte colorBits(LedColor c) {
    bool r = (c == LED_RED    || c == LED_YELLOW || c == LED_PURPLE);
    bool g = (c == LED_GREEN  || c == LED_YELLOW);
    bool b = (c == LED_BLUE   || c == LED_PURPLE);
    return (r ? 4 : 0) | (g ? 2 : 0) | (b ? 1 : 0);
}

static void updateLeds(LedColor status, LedColor alert, int moisture) {
    byte leds = (colorBits(status) << 5) | (colorBits(alert) << 2);
    byte bar  = (byte)((1 << soilBarSegments(moisture)) - 1);
    shiftOut2(leds, bar);
}

// ── Display rendering ─────────────────────────────────────────────────────────

static void renderNormal(int soil, int temp, int lux) {
    static const char* const exprSymbols[] = { ":)", ":(", ">.<", "-_-", ">_<", "zzz" };

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
    bool night    = isNightHour(hour);
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
        if (!buzzerMuted) tone(PIN_BUZZER, 1000, 300);
        lastEventAt = millis();

    } else if (strcmp(topic, "plant/commands") == 0) {
        const char* action = doc["action"] | "";
        if (strcmp(action, "mute") == 0) buzzerMuted = true;
    }
}

static void connectMqtt() {
    Serial.print("MQTT connecting");
    while (!mqttClient.connect(MQTT_CLIENT)) {
        Serial.print(".");
        delay(500);
    }
    Serial.println(" connected");
    mqttClient.subscribe("plant/state");
    mqttClient.subscribe("plant/alerts");
    mqttClient.subscribe("plant/commands");
}

// ── Sensor read + publish ─────────────────────────────────────────────────────

static void readAndPublish() {
    unsigned long now = millis();
    char topic[48];
    char payload[96];

    // DHT11 — temperature and humidity
    float temp     = dht.readTemperature();
    float humidity = dht.readHumidity();
    if (!isnan(temp) && !isnan(humidity)) {
        buildTopic(topic, sizeof(topic), "dht11");
        buildPayloadDht11(payload, sizeof(payload), (int)temp, (int)humidity);
        mqttClient.publish(topic, payload);
        lastTemp = (int)temp;
    }

    // BMP180 — atmospheric pressure
    sensors_event_t event;
    if (bmp.getEvent(&event) && event.pressure > 0) {
        float altitude = bmp.pressureToAltitude(SENSORS_PRESSURE_SEALEVELHPA, event.pressure);
        buildTopic(topic, sizeof(topic), "bmp180");
        buildPayloadBmp180(payload, sizeof(payload), (int)event.pressure, (int)altitude);
        mqttClient.publish(topic, payload);
    }

    // Soil moisture (HL-69)
    int soilRaw  = analogRead(PIN_SOIL);
    int moisture = soilMoisturePercent(soilRaw);
    buildTopic(topic, sizeof(topic), "soil");
    buildPayloadSoil(payload, sizeof(payload), moisture);
    mqttClient.publish(topic, payload);
    lastSoil = moisture;

    // LDR — light level (left + right)
    int ldrLeft  = analogRead(PIN_LDR_LEFT);
    int ldrRight = analogRead(PIN_LDR_RIGHT);
    buildTopic(topic, sizeof(topic), "ldr");
    buildPayloadLdr(payload, sizeof(payload), ldrLeft, ldrRight);
    mqttClient.publish(topic, payload);
    int avg = (ldrLeft + ldrRight) / 2;
    lastLux = (int)round(((1023.0f - avg) / 1023.0f) * 1000.0f);

    // Rain sensor (LOW = rain detected on most modules)
    bool rain = digitalRead(PIN_RAIN) == LOW;
    buildTopic(topic, sizeof(topic), "rain");
    buildPayloadRain(payload, sizeof(payload), rain);
    mqttClient.publish(topic, payload);

    // MQ135 — air quality, only after warm-up
    int ppm = 0;
    if (isMq135Ready(now, bootTime)) {
        ppm = analogRead(PIN_MQ135);
        buildTopic(topic, sizeof(topic), "mq135");
        buildPayloadMq135(payload, sizeof(payload), ppm);
        mqttClient.publish(topic, payload);
    }

    // Update LEDs and display with fresh values
    LedColor statusColor = rgbStatusColor(plantState);
    LedColor alertColor  = isMq135Ready(now, bootTime)
                               ? rgbAlertColor(rain, lastTemp, moisture, ppm)
                               : LED_OFF;
    updateLeds(statusColor, alertColor, moisture);
    updateDisplay();
}

// ── Button actions ────────────────────────────────────────────────────────────

static void handleBtn1Short() {
    // Wake display if off, otherwise just reset the economy timer
    lastEventAt = millis();
    if (!oledOn) {
        oled.ssd1306_command(SSD1306_DISPLAYON);
        oled.dim(false);
        oledOn = true;
    }
}

static void handleBtn1Long() {
    buzzerMuted = true;
    char topic[48], payload[64];
    buildTopic(topic, sizeof(topic), "commands");
    buildPayloadCommand(payload, sizeof(payload), "mute", 0);
    mqttClient.publish(topic, payload);
    Serial.println("Buzzer muted");
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
    pinMode(PIN_BUZZER,   OUTPUT);  digitalWrite(PIN_BUZZER, LOW);
    pinMode(PIN_RAIN,     INPUT);
    pinMode(PIN_BTN1,     INPUT);
    pinMode(PIN_BTN2,     INPUT);
    pinMode(PIN_SR_DATA,  OUTPUT);
    pinMode(PIN_SR_LATCH, OUTPUT);
    pinMode(PIN_SR_CLK,   OUTPUT);

    // Clear shift register outputs
    shiftOut2(0x00, 0x00);

    Wire.begin();

    // Wi-Fi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("WiFi connecting");
    while (WiFi.status() != WL_CONNECTED) { Serial.print("."); delay(500); }
    Serial.println(" OK — " + WiFi.localIP().toString());

    // MQTT
    mqttClient.setServer(MQTT_HOST, MQTT_PORT);
    mqttClient.setCallback(onMessage);
    connectMqtt();

    // NTP
    ntp.begin();
    ntp.update();

    // Sensors
    dht.begin();
    if (!bmp.begin()) Serial.println("BMP180 not found — check wiring");

    // OLED
    if (!oled.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("SSD1306 not found — check wiring");
    } else {
        oled.clearDisplay();
        oled.setTextColor(SSD1306_WHITE);
        oled.setTextSize(1);
        oled.setCursor(0, 28);
        oled.print("Smart Plant ready");
        oled.display();
    }

    // Watchdog — restart if loop hangs for more than 8s
    ESP.wdtEnable(8000);

    Serial.println("Setup complete");
}

// ── loop ──────────────────────────────────────────────────────────────────────

void loop() {
    unsigned long now = millis();
    ESP.wdtFeed();

    // Reconnect Wi-Fi if dropped
    if (WiFi.status() != WL_CONNECTED) {
        Serial.print("WiFi lost, reconnecting");
        WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
        delay(500);
        return;
    }

    // Reconnect MQTT if dropped
    if (!mqttClient.connected()) connectMqtt();
    mqttClient.loop();

    // NTP sync (non-blocking; NTPClient internally throttles)
    ntp.update();

    // Buttons
    switch (buttonTick(btn1, digitalRead(PIN_BTN1) == HIGH, now)) {
        case BTN_SHORT_PRESS: handleBtn1Short(); break;
        case BTN_LONG_PRESS:  handleBtn1Long();  break;
        default: break;
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
