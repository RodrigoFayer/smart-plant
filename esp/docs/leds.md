# leds — RGB LED and soil-bar mapping

Built via TDD — see [`test/test_leds/test_leds.cpp`](../test/test_leds/test_leds.cpp) for the full spec-as-tests and [`leds.puml`](diagrams/leds.puml) for the mapping diagram.

> Implementation lives in `src/leds.h` / `src/leds.cpp`. No Arduino dependency — pure comparisons and `strcmp`, testable on the host native environment.

## `LedColor` enum

```cpp
typedef enum { LED_OFF, LED_RED, LED_GREEN, LED_YELLOW, LED_BLUE, LED_PURPLE } LedColor;
```

Shared by both RGB LEDs and the soil bar.

## `rgbStatusColor(const char* state)` — RGB LED 1

Maps the plant state string (received from the backend via MQTT/Socket.IO) to the general-status LED color:

| State | Color |
|---|---|
| `"happy"` | `LED_GREEN` |
| `"thirsty"` | `LED_YELLOW` |
| `"hot"` | `LED_YELLOW` |
| `"noLight"` | `LED_YELLOW` |
| `"sick"` | `LED_RED` |
| anything else | `LED_OFF` (safe default during boot or for future states) |

## `rgbAlertColor(bool rain, int temp, int soilMoisture, int ppm)` — RGB LED 2

Shows the most urgent currently active alert. Parameters come from the latest sensor readings already stored in memory — no re-reading hardware. Returns `LED_OFF` when all conditions are within normal range.

Priority order (highest to lowest):

| Priority | Condition | Color |
|---|---|---|
| 1 | `temp > 38` | `LED_RED` |
| 2 | `ppm > 700` | `LED_PURPLE` |
| 3 | `soilMoisture < 20` | `LED_YELLOW` |
| 4 | `rain == true` | `LED_BLUE` |
| — | none active | `LED_OFF` |

Thresholds are **strict** (`>` / `<`), matching the backend's `calculatePlantState` critical boundaries exactly — at boundary values (e.g. `temp == 38`, `soilMoisture == 20`) the alert is off.

## `soilBarSegments(int moisture)` — 5-LED bar count

| Moisture % | Segments lit |
|---|---|
| 0 | 0 |
| 1–20 | 1 |
| 21–40 | 2 |
| 41–60 | 3 |
| 61–80 | 4 |
| 81–100 | 5 |

## `soilBarColor(int moisture)` — 5-LED bar color

| Moisture % | Color |
|---|---|
| 0 | `LED_OFF` |
| 1–20 | `LED_RED` |
| 21–60 | `LED_YELLOW` |
| 61–100 | `LED_GREEN` |
