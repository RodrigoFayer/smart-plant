// ─────────────────────────────────────────────────────────────────────────────
// Hardware bring-up / wiring debug sketch.
// Only compiled in the [env:debug] PlatformIO environment (-D DEBUG_BUILD);
// the normal firmware (main.cpp) is excluded there, so this never ships.
//
//   pio run -e debug -t upload && pio device monitor -e debug
//
// Prints, once per second:
//   - I2C scan (expects 0x3C OLED + 0x48 ADS1115)
//   - ADS1115 A0..A3 raw counts + volts (soil, MQ135, A2 unused, LDR)
//   - DHT11 temperature / humidity
//   - rain digital (LOW = rain)
//   - BTN1 / BTN2 state (HIGH = pressed, with the 10k pull-down)
// ─────────────────────────────────────────────────────────────────────────────
#ifdef DEBUG_BUILD

#include <Arduino.h>
#include <Wire.h>
#include <Adafruit_ADS1X15.h>
#include <DHT.h>
#include "config.h"

Adafruit_ADS1115 ads;
DHT dht(PIN_DHT11, DHT11);

static bool adsOk = false;

static void i2cScan() {
  Serial.print(F("I2C scan: "));
  uint8_t found = 0;
  for (uint8_t addr = 1; addr < 127; addr++) {
    Wire.beginTransmission(addr);
    if (Wire.endTransmission() == 0) {
      Serial.printf("0x%02X ", addr);
      found++;
    }
  }
  if (found == 0) Serial.print(F("(nothing found!)"));
  Serial.println();
  Serial.printf("  OLED 0x3C: %s   ADS1115 0x48: %s\n",
                (found && (Wire.beginTransmission(0x3C), Wire.endTransmission() == 0)) ? "OK" : "MISSING",
                (Wire.beginTransmission(0x48), Wire.endTransmission() == 0) ? "OK" : "MISSING");
}

static void readAds() {
  if (!adsOk) {
    Serial.println(F("ADS1115: not initialised (check VDD/GND/SDA/SCL/ADDR)"));
    return;
  }
  const char *names[4] = {"A0 soil  ", "A1 mq135 ", "A2 unused", "A3 ldr   "};
  for (uint8_t ch = 0; ch < 4; ch++) {
    int16_t raw = ads.readADC_SingleEnded(ch);
    float volts = ads.computeVolts(raw);
    Serial.printf("  ADS %s  raw=%6d  %.3f V\n", names[ch], raw, volts);
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println(F("\n\n=== Smart Plant — hardware debug ==="));

  Wire.begin();           // SDA=D2, SCL=D1 (NodeMCU defaults)
  Wire.setClock(100000);

  adsOk = ads.begin(ADS_ADDR);
  Serial.println(adsOk ? F("ADS1115 begin OK") : F("ADS1115 begin FAILED"));

  dht.begin();

  pinMode(PIN_RAIN, INPUT);
  pinMode(PIN_BTN1, INPUT);   // external 10k pull-down
  pinMode(PIN_BTN2, INPUT);   // external 10k pull-down
}

void loop() {
  Serial.println(F("\n--------------------------------------------------"));

  i2cScan();
  readAds();

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (isnan(t) || isnan(h))
    Serial.println(F("  DHT11: read FAILED (check data->D3, VCC->3V3, GND)"));
  else
    Serial.printf("  DHT11: %.1f C   %.0f %%RH\n", t, h);

  Serial.printf("  Rain D5: %s\n", digitalRead(PIN_RAIN) == LOW ? "RAIN (LOW)" : "dry (HIGH)");
  Serial.printf("  BTN1 D6: %s   BTN2 D7: %s\n",
                digitalRead(PIN_BTN1) == HIGH ? "PRESSED" : "released",
                digitalRead(PIN_BTN2) == HIGH ? "PRESSED" : "released");

  delay(1000);
}

#endif // DEBUG_BUILD
