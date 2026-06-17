# Available hardware

| Component | Qty | Use |
|---|---|---|
| NodeMCU ESP12 Amica | 1 | Main microcontroller |
| ADS1115 (16-bit I2C ADC, 4 channels) | 1 | Analog reads for soil, MQ135 and the LDR |
| 0.96" I2C OLED display (SSD1306) | 1 | Tamagotchi + readings |
| DHT11 | 1 | Air temperature and humidity |
| MQ135 | 1 | Air quality (ppm) — analog via ADS1115 |
| Rain sensor | 1 | Precipitation detection (digital) |
| LDR | 1 | Light level — analog (lux) via ADS1115 (channel A3) |
| HL-69 soil moisture sensor | 1 | Soil moisture — analog via ADS1115 |
| 10k potentiometer | 1 | Fine adjustment / general use |
| Active buzzer | 1 | Sound alerts (optional — not installed in this build) |
| Push button | 2 | BTN1: wake/mode — BTN2: manual watering |
| 1kΩ resistors | 10 | MQ135/LDR voltage divider |
| 10kΩ resistors | 10 | Button pull-down |

> The ESP8266 has a single native ADC (A0), so the three analog sensors share an external
> ADS1115 on the I2C bus (alongside the OLED). See [esp/docs/wiring.md](../esp/docs/wiring.md)
> for the full pinout and breadboard layout.
