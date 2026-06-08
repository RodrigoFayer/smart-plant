#include <unity.h>
#include "buttons.h"

void setUp() {}
void tearDown() {}

// ─── Helpers ──────────────────────────────────────────────────────────────────

static ButtonState btn;

// Simulates holding the button from t=0 for `holdMs`, then releasing.
// Returns the events collected at key moments.
static ButtonEvent tickAt(bool pressed, unsigned long now) {
    return buttonTick(btn, pressed, now);
}

// ─── Idle / not pressed ───────────────────────────────────────────────────────

void test_returns_none_when_never_pressed() {
    btn = {};
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(false, 0));
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(false, 5000));
}

// ─── Debounce ─────────────────────────────────────────────────────────────────

void test_returns_none_on_first_press_tick() {
    btn = {};
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(true, 0));
}

void test_returns_none_while_within_debounce_window() {
    btn = {};
    tickAt(true, 0);                         // press start
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(true, 1));
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(true, 25));
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(true, DEBOUNCE_MS - 1));
}

void test_noisy_bounce_under_debounce_is_ignored() {
    // Button goes high then low within the debounce window — no event.
    btn = {};
    tickAt(true, 0);
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(false, 10)); // released before 50ms
    // State is reset: another press starting fresh
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(false, 100));
}

// ─── Short press ──────────────────────────────────────────────────────────────

void test_short_press_fires_on_release_after_debounce() {
    btn = {};
    tickAt(true, 0);
    tickAt(true, 100);                        // held past debounce
    TEST_ASSERT_EQUAL(BTN_SHORT_PRESS, tickAt(false, 200)); // released
}

void test_short_press_fires_up_to_long_press_threshold() {
    btn = {};
    tickAt(true, 0);
    tickAt(true, DEBOUNCE_MS);
    // Released just before the long-press threshold
    TEST_ASSERT_EQUAL(BTN_SHORT_PRESS, tickAt(false, LONG_PRESS_MS - 1));
}

void test_short_press_resets_state_for_next_press() {
    btn = {};
    tickAt(true, 0);
    tickAt(true, 100);
    tickAt(false, 200);                       // first short press

    // Second independent press
    tickAt(true, 1000);
    tickAt(true, 1100);
    TEST_ASSERT_EQUAL(BTN_SHORT_PRESS, tickAt(false, 1200));
}

// ─── Long press ───────────────────────────────────────────────────────────────

void test_long_press_fires_after_threshold_while_held() {
    btn = {};
    tickAt(true, 0);
    tickAt(true, DEBOUNCE_MS);
    TEST_ASSERT_EQUAL(BTN_LONG_PRESS, tickAt(true, LONG_PRESS_MS));
}

void test_long_press_fires_only_once_while_held() {
    btn = {};
    tickAt(true, 0);
    tickAt(true, DEBOUNCE_MS);
    tickAt(true, LONG_PRESS_MS);              // first long press fires
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(true, LONG_PRESS_MS + 100));
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(true, LONG_PRESS_MS + 500));
}

void test_no_short_press_fires_after_long_press() {
    btn = {};
    tickAt(true, 0);
    tickAt(true, DEBOUNCE_MS);
    tickAt(true, LONG_PRESS_MS);             // long press consumed
    TEST_ASSERT_EQUAL(BTN_NONE, tickAt(false, LONG_PRESS_MS + 100)); // release
}

void test_long_press_resets_state_for_next_press() {
    btn = {};
    tickAt(true, 0);
    tickAt(true, LONG_PRESS_MS);
    tickAt(false, LONG_PRESS_MS + 50);       // release after long press

    // Second independent short press
    tickAt(true, 2000);
    tickAt(true, 2100);
    TEST_ASSERT_EQUAL(BTN_SHORT_PRESS, tickAt(false, 2200));
}

// ─── Rollover safety ─────────────────────────────────────────────────────────

void test_short_press_survives_millis_rollover() {
    btn = {};
    unsigned long pressTime = 0xFFFFFFFF - 100; // 100ms before rollover
    tickAt(true, pressTime);
    // Released 200ms later — wraps through 0
    unsigned long releaseTime = 100;             // 200ms elapsed total
    TEST_ASSERT_EQUAL(BTN_SHORT_PRESS, tickAt(false, releaseTime));
}

void test_long_press_survives_millis_rollover() {
    btn = {};
    unsigned long pressTime = 0xFFFFFFFF - 100;
    tickAt(true, pressTime);
    unsigned long longTime = pressTime + LONG_PRESS_MS; // wraps
    TEST_ASSERT_EQUAL(BTN_LONG_PRESS, tickAt(true, longTime));
}

int main() {
    UNITY_BEGIN();

    RUN_TEST(test_returns_none_when_never_pressed);
    RUN_TEST(test_returns_none_on_first_press_tick);
    RUN_TEST(test_returns_none_while_within_debounce_window);
    RUN_TEST(test_noisy_bounce_under_debounce_is_ignored);

    RUN_TEST(test_short_press_fires_on_release_after_debounce);
    RUN_TEST(test_short_press_fires_up_to_long_press_threshold);
    RUN_TEST(test_short_press_resets_state_for_next_press);

    RUN_TEST(test_long_press_fires_after_threshold_while_held);
    RUN_TEST(test_long_press_fires_only_once_while_held);
    RUN_TEST(test_no_short_press_fires_after_long_press);
    RUN_TEST(test_long_press_resets_state_for_next_press);

    RUN_TEST(test_short_press_survives_millis_rollover);
    RUN_TEST(test_long_press_survives_millis_rollover);

    return UNITY_END();
}
