#ifndef BUTTONS_H
#define BUTTONS_H

#include <stdint.h>
#include <stdbool.h>

static const unsigned long DEBOUNCE_MS   = 50;
static const unsigned long LONG_PRESS_MS = 2000;

typedef enum {
    BTN_NONE = 0,
    BTN_SHORT_PRESS,
    BTN_LONG_PRESS,
} ButtonEvent;

typedef struct {
    bool          tracking;   // true while a press is being tracked
    unsigned long pressedAt;  // millis() when the press started
    bool          longFired;  // true once LONG_PRESS has been emitted
} ButtonState;

// Call every loop iteration with the current digital pin state and millis().
// Returns BTN_SHORT_PRESS or BTN_LONG_PRESS at the moment the event fires;
// BTN_NONE otherwise. Takes explicit timestamps so it is pure and testable
// without touching hardware time.
ButtonEvent buttonTick(ButtonState& btn, bool pressed, unsigned long now);

#endif
