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

// ── I2C (SSD1306 OLED + ADS1115 ADC) ─────────────────────────────────────────
// D1 (GPIO5) → SCL,  D2 (GPIO4) → SDA.
// Wire.begin() uses these by default on NodeMCU; no #defines needed.
// OLED lives at 0x3C; the ADS1115 shares the same bus at 0x48 (ADDR → GND).

// ── ADS1115 (external 16-bit I2C ADC — 3 analog sensors) ──────────────────────
#define ADS_ADDR         0x48  // I2C address with ADDR tied to GND
#define ADS_CH_SOIL      0     // A0 — HL-69 soil moisture
#define ADS_CH_MQ135     1     // A1 — MQ135 air quality
#define ADS_CH_LDR       3     // A3 — LDR voltage divider (light)
// A2 is unused (single LDR wired on A3).

// ── Sensors (digital lines on the ESP) ───────────────────────────────────────
#define PIN_DHT11    D3  // GPIO0  — data line
#define PIN_RAIN     D5  // GPIO14 — rain module digital OUT (LOW = rain)
// NOTE: soil, MQ135 and the LDR are analog reads on the ADS1115 (above).
// The ESP's native A0 and GPIOs D0/D8 are free for future use.

// ── Inputs ────────────────────────────────────────────────────────────────────
#define PIN_BTN1  D6  // GPIO12 — wake / mode  (10kΩ pull-down to GND)
#define PIN_BTN2  D7  // GPIO13 — manual water (10kΩ pull-down to GND)

#endif
