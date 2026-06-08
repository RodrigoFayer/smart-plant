#ifndef CONFIG_H
#define CONFIG_H

// ── Wi-Fi ────────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_NETWORK";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// ── MQTT ─────────────────────────────────────────────────────────────────────
const char* MQTT_HOST   = "192.168.1.100"; // backend's LAN IP
const int   MQTT_PORT   = 1883;
const char* MQTT_CLIENT = "smart-plant-esp";

// ── Timings ───────────────────────────────────────────────────────────────────
const unsigned long READING_INTERVAL   = 5000;  // ms between sensor reads
const unsigned long ECONOMY_TIMEOUT_MS = 30000; // ms of inactivity before display off

// ── I2C (BMP180 + SSD1306 — shared bus) ─────────────────────────────────────
// D1 (GPIO5) → SCL,  D2 (GPIO4) → SDA.
// Wire.begin() uses these by default on NodeMCU; no #defines needed.

// ── Sensors ───────────────────────────────────────────────────────────────────
#define PIN_DHT11     D3  // GPIO0  — data line
#define PIN_RAIN      D5  // GPIO14 — rain module digital OUT (LOW = rain)
#define PIN_SOIL      A0  // analog — HL-69 AO (0–1023, inverted: dry=high)
#define PIN_LDR_LEFT  D8  // GPIO15 — left LDR voltage divider
#define PIN_LDR_RIGHT D0  // GPIO16 — right LDR voltage divider
#define PIN_MQ135     A0  // analog — MQ135 AOUT
// NOTE: ESP8266 has a single ADC (A0). Soil, MQ135, and LDRs all need analog
// reads. Use an analog multiplexer (e.g. CD4051) to time-multiplex A0, or
// treat LDR outputs as digital threshold comparators on D8/D0.

// ── Inputs ────────────────────────────────────────────────────────────────────
#define PIN_BTN1  D6  // GPIO12 — mode / mute  (10kΩ pull-down to GND)
#define PIN_BTN2  D7  // GPIO13 — manual water (10kΩ pull-down to GND)

// ── Outputs ───────────────────────────────────────────────────────────────────
#define PIN_BUZZER  D4  // GPIO2 — active buzzer (HIGH = on)

// 74HC595 shift register chain — drives RGB LEDs + soil bar.
// All GPIO pins above are used by sensors/buttons/I2C. Resolve pin conflicts
// by sharing SPI pins or adding an I2C I/O expander before flashing.
// Placeholder assignments — adjust to match your wiring:
#define PIN_SR_DATA   D4
#define PIN_SR_LATCH  D5
#define PIN_SR_CLK    D6

// Shift register bit layout (two chained 74HC595):
//   Register 1 byte: [R1 G1 B1 R2 G2 B2 - -]  (RGB LED 1 + RGB LED 2)
//   Register 2 byte: [- - - BAR4 BAR3 BAR2 BAR1 BAR0]  (soil LED bar)

#endif
