# Inputs — buttons & soil sensor

## Button behavior

### BTN1 — Mode / Mute
- **Short press** (< 1s): cycles the OLED display mode (Normal → Night → Economy)
- **Long press** (> 2s): mutes the buzzer and publishes `plant/commands {"action": "mute"}`
- Implement with 50ms debounce and `millis()` — never use `delay()`

### BTN2 — Manual watering
- **Any press**: logs a manual watering, publishes `plant/commands {"action": "manual_watering", "timestamp": <epoch>}`
- Buttonless alternative: detect a sharp rise in the HL-69 reading (> 20 points in < 30s) and publish automatically

## Reading the HL-69

The ESP8266 has only one analog pin (A0) at 10-bit resolution (0–1023). The HL-69 outputs a voltage inversely proportional to moisture — dry soil = high value, wet soil = low value. Invert and map the reading:

```cpp
int raw = analogRead(A0);              // 0–1023
int moisture = map(raw, 1023, 0, 0, 100); // invert and convert to %
moisture = constrain(moisture, 0, 100);
```

> The 10k potentiometer remains available in the kit for general use (brightness adjustment, local threshold, etc).
