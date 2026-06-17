# buttons — debounce and short/long press detection

Built via TDD — see [`test/test_buttons/test_buttons.cpp`](../test/test_buttons/test_buttons.cpp) for the full spec-as-tests and [`buttons.puml`](diagrams/buttons.puml) for the state machine diagram.

> Implementation lives in `src/buttons.h` / `src/buttons.cpp`. No Arduino dependency — takes explicit timestamps so it is pure and testable without hardware. Call `buttonTick()` on every loop iteration for each button.

## Constants

| Constant | Value | Meaning |
|---|---|---|
| `DEBOUNCE_MS` | 50 ms | Minimum press duration to be considered real |
| `LONG_PRESS_MS` | 2000 ms | Hold duration that triggers a long press |

## `ButtonState`

Tracks the state of one button between loop iterations. Zero-initialise at startup (`ButtonState btn = {}`):

```cpp
typedef struct {
    bool          tracking;   // true while a press is being tracked
    unsigned long pressedAt;  // millis() when the press started
    bool          longFired;  // true once LONG_PRESS has been emitted
} ButtonState;
```

## `buttonTick(ButtonState& btn, bool pressed, unsigned long now)`

Call once per loop per button, passing the current pin reading and `millis()`. Returns a `ButtonEvent`:

| Return value | When |
|---|---|
| `BTN_NONE` | Nothing to report (most ticks) |
| `BTN_SHORT_PRESS` | Button released after ≥ `DEBOUNCE_MS` and before `LONG_PRESS_MS` was reached |
| `BTN_LONG_PRESS` | Button has been held for ≥ `LONG_PRESS_MS` (fires once, while still held) |

## State machine

```
[IDLE] ──── press ────► [TRACKING]
                            │
               held < LONG_PRESS_MS ──── release after DEBOUNCE_MS ──► BTN_SHORT_PRESS → [IDLE]
                            │
               held ≥ LONG_PRESS_MS ──► BTN_LONG_PRESS (once)
                            │
                        release ──► BTN_NONE → [IDLE]
```

Key invariants locked in by tests:
- A bounce (release within `DEBOUNCE_MS`) fires nothing and resets state.
- `BTN_LONG_PRESS` fires **exactly once** while the button is held — not on every tick.
- After a long press, releasing the button does **not** also fire `BTN_SHORT_PRESS`.
- Unsigned subtraction of timestamps handles `millis()` rollover correctly (~49.7 days uptime).

## Usage in `main.cpp`

```cpp
ButtonState btn1 = {}, btn2 = {};

void loop() {
    unsigned long now = millis();

    if (buttonTick(btn1, digitalRead(PIN_BTN1), now) == BTN_SHORT_PRESS) {
        wakeDisplay();
    }

    if (buttonTick(btn2, digitalRead(PIN_BTN2), now) == BTN_SHORT_PRESS) {
        logManualWatering(now);
    }
}
```
