#include <unity.h>
#include "display.h"

void setUp() {}
void tearDown() {}

// ─── stateToExpression ────────────────────────────────────────────────────────

void test_happy_state_maps_to_expr_happy() {
    TEST_ASSERT_EQUAL(EXPR_HAPPY, stateToExpression("happy"));
}

void test_thirsty_state_maps_to_expr_thirsty() {
    TEST_ASSERT_EQUAL(EXPR_THIRSTY, stateToExpression("thirsty"));
}

void test_hot_state_maps_to_expr_hot() {
    TEST_ASSERT_EQUAL(EXPR_HOT, stateToExpression("hot"));
}

void test_no_light_state_maps_to_expr_no_light() {
    TEST_ASSERT_EQUAL(EXPR_NO_LIGHT, stateToExpression("noLight"));
}

void test_sick_state_maps_to_expr_sick() {
    TEST_ASSERT_EQUAL(EXPR_SICK, stateToExpression("sick"));
}

void test_sleeping_state_maps_to_expr_sleeping() {
    TEST_ASSERT_EQUAL(EXPR_SLEEPING, stateToExpression("sleeping"));
}

void test_unknown_state_defaults_to_expr_happy() {
    TEST_ASSERT_EQUAL(EXPR_HAPPY, stateToExpression("unknown"));
    TEST_ASSERT_EQUAL(EXPR_HAPPY, stateToExpression(""));
}

// ─── stateToFooter ────────────────────────────────────────────────────────────

void test_footer_happy() {
    TEST_ASSERT_EQUAL_STRING("I'm doing great!", stateToFooter("happy"));
}

void test_footer_thirsty() {
    TEST_ASSERT_EQUAL_STRING("I need water...", stateToFooter("thirsty"));
}

void test_footer_hot() {
    TEST_ASSERT_EQUAL_STRING("It's too hot!", stateToFooter("hot"));
}

void test_footer_no_light() {
    TEST_ASSERT_EQUAL_STRING("I need more light...", stateToFooter("noLight"));
}

void test_footer_sick() {
    TEST_ASSERT_EQUAL_STRING("I don't feel well...", stateToFooter("sick"));
}

void test_footer_unknown_defaults_to_happy_message() {
    TEST_ASSERT_EQUAL_STRING("I'm doing great!", stateToFooter("unknown"));
}

// ─── sensorBarHeight ─────────────────────────────────────────────────────────

void test_bar_midpoint_maps_to_half_height() {
    TEST_ASSERT_EQUAL(10, sensorBarHeight(50, 0, 100, 20));
}

void test_bar_minimum_maps_to_zero() {
    TEST_ASSERT_EQUAL(0, sensorBarHeight(0, 0, 100, 20));
}

void test_bar_maximum_maps_to_full_height() {
    TEST_ASSERT_EQUAL(20, sensorBarHeight(100, 0, 100, 20));
}

void test_bar_value_above_max_is_clamped() {
    TEST_ASSERT_EQUAL(20, sensorBarHeight(200, 0, 100, 20));
}

void test_bar_value_below_min_is_clamped() {
    TEST_ASSERT_EQUAL(0, sensorBarHeight(-10, 0, 100, 20));
}

void test_bar_temperature_25c_on_40c_scale_32px() {
    // temp 0–40 → bar 0–32px: 25°C should be 20px
    TEST_ASSERT_EQUAL(20, sensorBarHeight(25, 0, 40, 32));
}

// ─── isNightHour ─────────────────────────────────────────────────────────────

void test_night_hour_22_is_night() {
    TEST_ASSERT_TRUE(isNightHour(22));
}

void test_night_hour_23_is_night() {
    TEST_ASSERT_TRUE(isNightHour(23));
}

void test_night_hour_0_is_night() {
    TEST_ASSERT_TRUE(isNightHour(0));
}

void test_night_hour_6_is_night() {
    TEST_ASSERT_TRUE(isNightHour(6));
}

void test_night_hour_7_is_not_night() {
    TEST_ASSERT_FALSE(isNightHour(7));
}

void test_night_hour_12_is_not_night() {
    TEST_ASSERT_FALSE(isNightHour(12));
}

void test_night_hour_21_is_not_night() {
    TEST_ASSERT_FALSE(isNightHour(21));
}

// ─── isEconomyTimedOut ────────────────────────────────────────────────────────

void test_economy_not_timed_out_before_timeout() {
    TEST_ASSERT_FALSE(isEconomyTimedOut(0, 29999, 30000));
}

void test_economy_timed_out_at_exactly_timeout() {
    TEST_ASSERT_TRUE(isEconomyTimedOut(0, 30000, 30000));
}

void test_economy_timed_out_after_timeout() {
    TEST_ASSERT_TRUE(isEconomyTimedOut(0, 60000, 30000));
}

void test_economy_resets_when_event_occurs() {
    // Event at t=50000: lastEventAt updated, should NOT be timed out 10s later
    TEST_ASSERT_FALSE(isEconomyTimedOut(50000, 59999, 30000));
}

void test_economy_survives_millis_rollover() {
    unsigned long lastEvent = 0xFFFFFFFF - 10000; // 10s before rollover
    unsigned long now       = 25000;              // 35s elapsed total (wraps)
    TEST_ASSERT_TRUE(isEconomyTimedOut(lastEvent, now, 30000));
}

int main() {
    UNITY_BEGIN();

    RUN_TEST(test_happy_state_maps_to_expr_happy);
    RUN_TEST(test_thirsty_state_maps_to_expr_thirsty);
    RUN_TEST(test_hot_state_maps_to_expr_hot);
    RUN_TEST(test_no_light_state_maps_to_expr_no_light);
    RUN_TEST(test_sick_state_maps_to_expr_sick);
    RUN_TEST(test_sleeping_state_maps_to_expr_sleeping);
    RUN_TEST(test_unknown_state_defaults_to_expr_happy);

    RUN_TEST(test_footer_happy);
    RUN_TEST(test_footer_thirsty);
    RUN_TEST(test_footer_hot);
    RUN_TEST(test_footer_no_light);
    RUN_TEST(test_footer_sick);
    RUN_TEST(test_footer_unknown_defaults_to_happy_message);

    RUN_TEST(test_bar_midpoint_maps_to_half_height);
    RUN_TEST(test_bar_minimum_maps_to_zero);
    RUN_TEST(test_bar_maximum_maps_to_full_height);
    RUN_TEST(test_bar_value_above_max_is_clamped);
    RUN_TEST(test_bar_value_below_min_is_clamped);
    RUN_TEST(test_bar_temperature_25c_on_40c_scale_32px);

    RUN_TEST(test_night_hour_22_is_night);
    RUN_TEST(test_night_hour_23_is_night);
    RUN_TEST(test_night_hour_0_is_night);
    RUN_TEST(test_night_hour_6_is_night);
    RUN_TEST(test_night_hour_7_is_not_night);
    RUN_TEST(test_night_hour_12_is_not_night);
    RUN_TEST(test_night_hour_21_is_not_night);

    RUN_TEST(test_economy_not_timed_out_before_timeout);
    RUN_TEST(test_economy_timed_out_at_exactly_timeout);
    RUN_TEST(test_economy_timed_out_after_timeout);
    RUN_TEST(test_economy_resets_when_event_occurs);
    RUN_TEST(test_economy_survives_millis_rollover);

    return UNITY_END();
}
