# Inputs — buttons & soil sensor

## Button behavior

### BTN1 — Wake / Mode
- **Short press** (< 1s): wakes the OLED display (or refreshes the economy timer)
- Implement with 50ms debounce and `millis()` — never use `delay()`
- No buzzer is installed, so there is no mute action.

### BTN2 — Manual watering
- **Any press**: logs a manual watering, publishes `plant/commands {"action": "manual_watering", "timestamp": <epoch>}`
- Buttonless alternative: detect a sharp rise in the HL-69 reading (> 20 points in < 30s) and publish automatically

## Reading the HL-69

The HL-69 is read through the external **ADS1115** ADC (channel A0), not the ESP's native
pin. Its raw count is normalised to the shared 0–1023 domain, then converted. The HL-69
outputs a voltage inversely proportional to moisture — dry soil = high value, wet soil =
low value:

```cpp
int raw = adsToRaw10(ads.readADC_SingleEnded(ADS_CH_SOIL)); // 0–1023
int moisture = soilMoisturePercent(raw);                    // invert + clamp to 0–100%
```
