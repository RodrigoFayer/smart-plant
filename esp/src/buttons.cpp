#include "buttons.h"

ButtonEvent buttonTick(ButtonState& btn, bool pressed, unsigned long now) {
    if (pressed) {
        if (!btn.tracking) {
            btn.tracking  = true;
            btn.pressedAt = now;
            btn.longFired = false;
            return BTN_NONE;
        }

        unsigned long elapsed = now - btn.pressedAt;
        if (elapsed >= LONG_PRESS_MS && !btn.longFired) {
            btn.longFired = true;
            return BTN_LONG_PRESS;
        }
        return BTN_NONE;
    }

    // Button released
    if (btn.tracking) {
        unsigned long elapsed        = now - btn.pressedAt;
        bool          wasDebounced   = elapsed >= DEBOUNCE_MS;
        bool          longAlreadyFired = btn.longFired;
        btn.tracking  = false;
        btn.longFired = false;

        if (wasDebounced && !longAlreadyFired) {
            return BTN_SHORT_PRESS;
        }
    }
    return BTN_NONE;
}
