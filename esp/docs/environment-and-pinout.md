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
    adafruit/Adafruit ADS1X15     ; external I2C ADC (analog sensors)
    arduino-libraries/NTPClient   ; time for night mode
```

## Pinout

| ESP pin | Component | Notes |
|---|---|---|
| D1 (GPIO5) | SCL | I2C — OLED (0x3C) + ADS1115 (0x48) |
| D2 (GPIO4) | SDA | I2C — OLED (0x3C) + ADS1115 (0x48) |
| D3 (GPIO0) | DHT11 | Data |
| D4 (GPIO2) | — | Free (buzzer not installed) |
| D5 (GPIO14) | Rain sensor (DO) | LM393 digital OUT (LOW = rain) |
| D6 (GPIO12) | BTN1 | 10kΩ pull-down to GND |
| D7 (GPIO13) | BTN2 | 10kΩ pull-down to GND |
| A0, D0, D8 | — | Free (analog sensors moved to the ADS1115) |

### Analog sensors — on the ADS1115 (I2C 0x48)

| ADS1115 channel | Component | Notes |
|---|---|---|
| A0 | HL-69 (AO) | Soil moisture |
| A1 | MQ135 (AO) | Air quality — real ppm |
| A2 | — | Unused |
| A3 | LDR | Voltage divider — lux |

> The ESP8266 has a single native ADC (A0), so the three analog sensors share an external
> ADS1115 on the I2C bus. This frees the ESP's A0/D0/D8. A single LDR is wired on A3 (A2 is unused).
> Full wiring and breadboard layout: [wiring.md](wiring.md).
