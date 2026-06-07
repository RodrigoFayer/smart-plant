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
    adafruit/Adafruit BMP085 Unified ; BMP180
    adafruit/Adafruit Unified Sensor
    adafruit/Adafruit SSD1306     ; OLED
    adafruit/Adafruit GFX Library
    arduino-libraries/NTPClient   ; time for night mode
```

## Pinout

| ESP pin | Component | Notes |
|---|---|---|
| D1 (GPIO5) | SCL | I2C — shared by BMP180 and OLED |
| D2 (GPIO4) | SDA | I2C — shared by BMP180 and OLED |
| D3 (GPIO0) | DHT11 | Data |
| D4 (GPIO2) | Buzzer | Active — HIGH = on |
| D5 (GPIO14) | Rain sensor | Module's digital OUT |
| D6 (GPIO12) | BTN1 | 10kΩ pull-down to GND |
| D7 (GPIO13) | BTN2 | 10kΩ pull-down to GND |
| A0 | HL-69 (AO) | Analog soil-moisture reading |
| D8 (GPIO15) | Left LDR | Divider with 10kΩ |
| D0 (GPIO16) | Right LDR | Divider with 10kΩ |
| D4–D9 (via 74HC595 shift register) | Soil-level LED bar | 5 LEDs — DATA/LATCH/CLK |

> The RGB LEDs use 3 pins each (R, G, B) with a 220Ω resistor in series.
> If you run out of pins, use the 74HC595 shift register to expand digital outputs.
