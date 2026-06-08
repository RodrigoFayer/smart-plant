# display — Tamagotchi expressions, sensor bars, and display modes

Built via TDD — see [`test/test_display/test_display.cpp`](../test/test_display/test_display.cpp) for the full spec-as-tests and [`display.puml`](diagrams/display.puml) for the state/mapping diagram.

> Implementation lives in `src/display.h` / `src/display.cpp`. The pure logic functions (state mapping, bar math, mode rules) have no Arduino or SSD1306 dependency and are fully host-testable. The drawing functions (`drawTamagotchi`, `drawSensorBars`, etc.) that call the Adafruit SSD1306 API live in the same files but are exercised on device.

## `TamagotchiExpr` enum

```cpp
typedef enum {
    EXPR_HAPPY = 0,
    EXPR_THIRSTY,
    EXPR_HOT,
    EXPR_NO_LIGHT,
    EXPR_SICK,
    EXPR_SLEEPING,
} TamagotchiExpr;
```

## `stateToExpression(const char* state)` → `TamagotchiExpr`

Maps the plant state string received from the backend (via MQTT `plant/state`) to the Tamagotchi expression to render on the OLED.

| State | Expression |
|---|---|
| `"happy"` | `EXPR_HAPPY` |
| `"thirsty"` | `EXPR_THIRSTY` |
| `"hot"` | `EXPR_HOT` |
| `"noLight"` | `EXPR_NO_LIGHT` |
| `"sick"` | `EXPR_SICK` |
| `"sleeping"` | `EXPR_SLEEPING` |
| any unknown | `EXPR_HAPPY` (default) |

## `stateToFooter(const char* state)` → `const char*`

Returns the footer message shown at the bottom of the OLED in normal mode.

| State | Footer |
|---|---|
| `"happy"` | `"I'm doing great!"` |
| `"thirsty"` | `"I need water..."` |
| `"hot"` | `"It's too hot!"` |
| `"noLight"` | `"I need more light..."` |
| `"sick"` | `"I don't feel well..."` |
| any unknown | `"I'm doing great!"` |

## `sensorBarHeight(int value, int minVal, int maxVal, int maxPx)` → `int`

Maps a sensor reading to a pixel bar height for the three vertical bars (soil moisture, temperature, lux) on the right side of the OLED. Values outside `[minVal, maxVal]` are clamped.

```
sensorBarHeight(50, 0, 100, 20)  → 10   // 50% of 20px
sensorBarHeight(25, 0,  40, 32)  → 20   // 25°C on 0–40°C scale, 32px
sensorBarHeight(200, 0, 100, 20) → 20   // clamped to max
```

## `isNightHour(int hour)` → `bool`

Hours **22–23** and **0–6** are considered night — display switches to night mode (dim, clock only, sleeping expression). Hours 7–21 are daytime.

## `isEconomyTimedOut(unsigned long lastEventAt, unsigned long now, unsigned long timeoutMs)` → `bool`

Economy mode: display turns off after `timeoutMs` milliseconds with no events (button press, new alert). Returns `true` when the display should be off.

```cpp
// Default timeout used in main.cpp
static const unsigned long ECONOMY_TIMEOUT_MS = 30000;

// In the event handler:
lastEventAt = millis();

// In loop():
if (isEconomyTimedOut(lastEventAt, millis(), ECONOMY_TIMEOUT_MS)) {
    display.ssd1306_command(SSD1306_DISPLAYOFF);
}
```

Unsigned subtraction handles `millis()` rollover (~49.7 days) correctly.

## OLED modes

| Mode | Condition | What is shown |
|---|---|---|
| Normal | Daytime + activity within timeout | Tamagotchi expression + sensor bars + footer |
| Night | `isNightHour(hour)` | Dimmed clock, sleeping expression (`EXPR_SLEEPING`) |
| Economy off | `isEconomyTimedOut(...)` | Display off; wakes on button press or new alert |
