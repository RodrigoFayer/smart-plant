#include <unity.h>
#include "leds.h"

void setUp() {}
void tearDown() {}

// ─── rgbStatusColor ───────────────────────────────────────────────────────────
// RGB LED 1 — maps the plant state string received from the backend
// to the LED color the user sees.

void test_status_happy_is_green() {
    TEST_ASSERT_EQUAL(LED_GREEN, rgbStatusColor("happy"));
}

void test_status_thirsty_is_yellow() {
    TEST_ASSERT_EQUAL(LED_YELLOW, rgbStatusColor("thirsty"));
}

void test_status_hot_is_yellow() {
    TEST_ASSERT_EQUAL(LED_YELLOW, rgbStatusColor("hot"));
}

void test_status_nolight_is_yellow() {
    TEST_ASSERT_EQUAL(LED_YELLOW, rgbStatusColor("noLight"));
}

void test_status_sick_is_red() {
    TEST_ASSERT_EQUAL(LED_RED, rgbStatusColor("sick"));
}

void test_status_unknown_state_is_off() {
    // Safe default for any unexpected state string (e.g. mid-boot, future state)
    TEST_ASSERT_EQUAL(LED_OFF, rgbStatusColor("sleeping"));
    TEST_ASSERT_EQUAL(LED_OFF, rgbStatusColor(""));
    TEST_ASSERT_EQUAL(LED_OFF, rgbStatusColor("unknown"));
}

// ─── rgbAlertColor ────────────────────────────────────────────────────────────
// RGB LED 2 — shows the most urgent active alert, or off when all clear.
// Priority (highest → lowest): temp > ppm > soil > rain.

void test_alert_all_clear_is_off() {
    TEST_ASSERT_EQUAL(LED_OFF, rgbAlertColor(false, 25, 65, 320));
}

void test_alert_rain_detected_is_blue() {
    TEST_ASSERT_EQUAL(LED_BLUE, rgbAlertColor(true, 25, 65, 320));
}

void test_alert_dry_soil_below_20_is_yellow() {
    TEST_ASSERT_EQUAL(LED_YELLOW, rgbAlertColor(false, 25, 15, 320));
}

void test_alert_dry_soil_at_exactly_20_is_off() {
    // threshold is strictly < 20 — at 20% the plant is not yet critical
    TEST_ASSERT_EQUAL(LED_OFF, rgbAlertColor(false, 25, 20, 320));
}

void test_alert_critical_temp_above_38_is_red() {
    TEST_ASSERT_EQUAL(LED_RED, rgbAlertColor(false, 39, 65, 320));
}

void test_alert_critical_temp_at_exactly_38_is_off() {
    // threshold is strictly > 38
    TEST_ASSERT_EQUAL(LED_OFF, rgbAlertColor(false, 38, 65, 320));
}

void test_alert_polluted_air_above_700_is_purple() {
    TEST_ASSERT_EQUAL(LED_PURPLE, rgbAlertColor(false, 25, 65, 701));
}

void test_alert_polluted_air_at_exactly_700_is_off() {
    // threshold is strictly > 700
    TEST_ASSERT_EQUAL(LED_OFF, rgbAlertColor(false, 25, 65, 700));
}

void test_alert_temp_beats_ppm_when_both_critical() {
    TEST_ASSERT_EQUAL(LED_RED, rgbAlertColor(false, 39, 65, 800));
}

void test_alert_ppm_beats_soil_when_both_critical() {
    TEST_ASSERT_EQUAL(LED_PURPLE, rgbAlertColor(false, 25, 15, 800));
}

void test_alert_soil_beats_rain_when_both_active() {
    TEST_ASSERT_EQUAL(LED_YELLOW, rgbAlertColor(true, 25, 15, 320));
}

// ─── soilBarSegments ──────────────────────────────────────────────────────────
// 5-LED bar — how many LEDs to light up for a given moisture %.

void test_bar_0_percent_is_0_segments() {
    TEST_ASSERT_EQUAL(0, soilBarSegments(0));
}

void test_bar_1_percent_is_1_segment() {
    TEST_ASSERT_EQUAL(1, soilBarSegments(1));
}

void test_bar_20_percent_is_1_segment() {
    TEST_ASSERT_EQUAL(1, soilBarSegments(20));
}

void test_bar_21_percent_is_2_segments() {
    TEST_ASSERT_EQUAL(2, soilBarSegments(21));
}

void test_bar_40_percent_is_2_segments() {
    TEST_ASSERT_EQUAL(2, soilBarSegments(40));
}

void test_bar_41_percent_is_3_segments() {
    TEST_ASSERT_EQUAL(3, soilBarSegments(41));
}

void test_bar_60_percent_is_3_segments() {
    TEST_ASSERT_EQUAL(3, soilBarSegments(60));
}

void test_bar_61_percent_is_4_segments() {
    TEST_ASSERT_EQUAL(4, soilBarSegments(61));
}

void test_bar_80_percent_is_4_segments() {
    TEST_ASSERT_EQUAL(4, soilBarSegments(80));
}

void test_bar_81_percent_is_5_segments() {
    TEST_ASSERT_EQUAL(5, soilBarSegments(81));
}

void test_bar_100_percent_is_5_segments() {
    TEST_ASSERT_EQUAL(5, soilBarSegments(100));
}

// ─── soilBarColor ─────────────────────────────────────────────────────────────
// The color of the LED bar changes with the moisture range.

void test_bar_color_0_is_off() {
    TEST_ASSERT_EQUAL(LED_OFF, soilBarColor(0));
}

void test_bar_color_1_to_20_is_red() {
    TEST_ASSERT_EQUAL(LED_RED, soilBarColor(1));
    TEST_ASSERT_EQUAL(LED_RED, soilBarColor(20));
}

void test_bar_color_21_to_60_is_yellow() {
    TEST_ASSERT_EQUAL(LED_YELLOW, soilBarColor(21));
    TEST_ASSERT_EQUAL(LED_YELLOW, soilBarColor(60));
}

void test_bar_color_61_to_100_is_green() {
    TEST_ASSERT_EQUAL(LED_GREEN, soilBarColor(61));
    TEST_ASSERT_EQUAL(LED_GREEN, soilBarColor(100));
}

int main() {
    UNITY_BEGIN();

    RUN_TEST(test_status_happy_is_green);
    RUN_TEST(test_status_thirsty_is_yellow);
    RUN_TEST(test_status_hot_is_yellow);
    RUN_TEST(test_status_nolight_is_yellow);
    RUN_TEST(test_status_sick_is_red);
    RUN_TEST(test_status_unknown_state_is_off);

    RUN_TEST(test_alert_all_clear_is_off);
    RUN_TEST(test_alert_rain_detected_is_blue);
    RUN_TEST(test_alert_dry_soil_below_20_is_yellow);
    RUN_TEST(test_alert_dry_soil_at_exactly_20_is_off);
    RUN_TEST(test_alert_critical_temp_above_38_is_red);
    RUN_TEST(test_alert_critical_temp_at_exactly_38_is_off);
    RUN_TEST(test_alert_polluted_air_above_700_is_purple);
    RUN_TEST(test_alert_polluted_air_at_exactly_700_is_off);
    RUN_TEST(test_alert_temp_beats_ppm_when_both_critical);
    RUN_TEST(test_alert_ppm_beats_soil_when_both_critical);
    RUN_TEST(test_alert_soil_beats_rain_when_both_active);

    RUN_TEST(test_bar_0_percent_is_0_segments);
    RUN_TEST(test_bar_1_percent_is_1_segment);
    RUN_TEST(test_bar_20_percent_is_1_segment);
    RUN_TEST(test_bar_21_percent_is_2_segments);
    RUN_TEST(test_bar_40_percent_is_2_segments);
    RUN_TEST(test_bar_41_percent_is_3_segments);
    RUN_TEST(test_bar_60_percent_is_3_segments);
    RUN_TEST(test_bar_61_percent_is_4_segments);
    RUN_TEST(test_bar_80_percent_is_4_segments);
    RUN_TEST(test_bar_81_percent_is_5_segments);
    RUN_TEST(test_bar_100_percent_is_5_segments);

    RUN_TEST(test_bar_color_0_is_off);
    RUN_TEST(test_bar_color_1_to_20_is_red);
    RUN_TEST(test_bar_color_21_to_60_is_yellow);
    RUN_TEST(test_bar_color_61_to_100_is_green);

    return UNITY_END();
}
