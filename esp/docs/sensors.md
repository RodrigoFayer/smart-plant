# sensors — pure sensor math

Built via TDD — see [`test/test_sensors.cpp`](../test/test_sensors.cpp) for the full spec-as-tests.

> Implementation lives in `src/sensors.h` / `src/sensors.cpp`. These files have no Arduino library dependencies beyond the minimal shim in `test/mocks/Arduino.h`, so they compile and test on the host (native PlatformIO environment) without any hardware.

## `soilMoisturePercent(int raw)`

Converts a raw 10-bit ADC reading from the HL-69 soil sensor (0–1023) to a moisture percentage (0–100).

The HL-69 is **inversely proportional**: dry soil produces a high ADC value, wet soil a low one. The formula inverts the scale, maps to 0–100, then clamps:

```cpp
int pct = map(raw, 1023, 0, 0, 100);   // invert + scale
return constrain(pct, 0, 100);          // clamp out-of-range readings
```

**Integer division note**: Arduino's `map()` uses integer truncation (not rounding), so the midpoint `raw = 512` → `49%`, while `raw = 511` → `50%`. Tests lock in these exact values to prevent unexpected regressions.

| ADC raw | Moisture % | Notes |
|---|---|---|
| 0 | 100 | fully wet |
| 511 | 50 | exact midpoint (truncation) |
| 512 | 49 | one step off midpoint |
| 818 | 20 | "dry soil critical" boundary (backend threshold `< 20`) |
| 819 | 19 | crosses into critical range |
| 1023 | 0 | fully dry |

## `isMq135Ready(unsigned long now, unsigned long bootTime)`

Returns `true` once `MQ135_WARMUP_MS` (30 000 ms) has elapsed since `bootTime`. The MQ135 air-quality sensor requires 30 s of warm-up after power-on before its readings are stable — per [implementation rules](implementation-rules.md).

Both timestamps are explicit parameters (not read from hardware) so the function is deterministically testable:

```cpp
bool isMq135Ready(unsigned long now, unsigned long bootTime) {
    return (now - bootTime) >= MQ135_WARMUP_MS;
}
```

**Rollover safety**: `unsigned long` subtraction wraps correctly at `0xFFFFFFFF` (~49.7 days), so a device that boots just before `millis()` rolls over will still report ready after the correct elapsed time. A test locks this in.
