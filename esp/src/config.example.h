#ifndef CONFIG_H
#define CONFIG_H

// ── Wi-Fi ────────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_NETWORK";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// ── MQTT ─────────────────────────────────────────────────────────────────────
const char* MQTT_HOST   = "192.168.1.100"; // backend's LAN IP
const int   MQTT_PORT   = 1883;
const char* MQTT_CLIENT = "smart-plant-esp";

// ── OTA (wireless firmware update) ────────────────────────────────────────────
// First flash must still be via USB. After that, update with:
//   pio run -t upload --upload-port smart-plant.local --upload-flags="--auth=YOUR_OTA_PASSWORD"
const char* OTA_HOSTNAME = "smart-plant";
const char* OTA_PASSWORD = "YOUR_OTA_PASSWORD";

// ── Timings ───────────────────────────────────────────────────────────────────
const unsigned long READING_INTERVAL   = 5000;  // ms between sensor reads
const unsigned long ECONOMY_TIMEOUT_MS = 30000; // ms of inactivity before display off

// ── I2C (SSD1306 OLED) ───────────────────────────────────────────────────────
// D1 (GPIO5) → SCL,  D2 (GPIO4) → SDA.
// Wire.begin() uses these by default on NodeMCU; no #defines needed.

// ── Sensors ───────────────────────────────────────────────────────────────────
#define PIN_DHT11    D3  // GPIO0  — data line
#define PIN_RAIN     D5  // GPIO14 — rain module digital OUT (LOW = rain)
#define PIN_SOIL     A0  // analog — HL-69 AO (0–1023, inverted: dry=high)
#define PIN_LDR_LEFT D8  // GPIO15 — LDR voltage divider (digital threshold)
#define PIN_MQ135_DO D0  // GPIO16 — MQ135 LM393 digital threshold (LOW = poor air quality)
// NOTE: ESP8266 has a single ADC (A0), already used by the soil sensor.
// LDR and MQ135 are read as digital threshold comparators instead.
// A second LDR (right) is deferred — no free GPIO left for it.

// ── Inputs ────────────────────────────────────────────────────────────────────
#define PIN_BTN1  D6  // GPIO12 — mode / mute  (10kΩ pull-down to GND)
#define PIN_BTN2  D7  // GPIO13 — manual water (10kΩ pull-down to GND)

// ── Outputs ───────────────────────────────────────────────────────────────────
#define PIN_BUZZER  D4  // GPIO2 — active buzzer (HIGH = on)

#endif
