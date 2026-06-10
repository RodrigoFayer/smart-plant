# Environment & pinout

## Environment

- **Board**: NodeMCU ESP12 Amica (ESP8266)
- **IDE**: PlatformIO (preferred) or Arduino IDE 2.x
- **Framework**: Arduino
- **Language**: C++

## Dependencies (platformio.ini)

```ini
[env:nodemcuv2]
platform = espressif8266
board = nodemcuv2
framework = arduino
lib_deps =
    knolleary/PubSubClient        ; MQTT
    adafruit/DHT sensor library   ; DHT11
    adafruit/Adafruit SSD1306     ; OLED
    adafruit/Adafruit GFX Library
    arduino-libraries/NTPClient   ; time for night mode
```

## Pinout

| ESP pin | Component | Notes |
|---|---|---|
| D0 (GPIO16) | MQ135 (DO) | LM393 digital threshold (LOW = poor air quality) |
| D1 (GPIO5) | SCL | I2C — OLED |
| D2 (GPIO4) | SDA | I2C — OLED |
| D3 (GPIO0) | DHT11 | Data |
| D4 (GPIO2) | Buzzer | Active — HIGH = on |
| D5 (GPIO14) | Rain sensor (DO) | LM393 digital OUT (LOW = rain) |
| D6 (GPIO12) | BTN1 | 10kΩ pull-down to GND |
| D7 (GPIO13) | BTN2 | 10kΩ pull-down to GND |
| A0 | HL-69 (AO) | Analog soil-moisture reading |
| D8 (GPIO15) | Left LDR | Voltage divider (digital threshold) |

> The ESP8266 has a single ADC (A0), already used by the soil sensor. LDR and MQ135 are read as digital threshold comparators instead. A second LDR (right) is deferred — no free GPIO left for it.
