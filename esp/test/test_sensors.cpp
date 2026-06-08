#include <unity.h>
#include "sensors.h"

void setUp() {}
void tearDown() {}

// ─── soilMoisturePercent ──────────────────────────────────────────────────────
// HL-69: dry soil = high ADC (1023), wet soil = low ADC (0).
// Formula: map(raw, 1023, 0, 0, 100) then constrain(0, 100).

void test_soil_raw_0_is_100_percent() {
    TEST_ASSERT_EQUAL(100, soilMoisturePercent(0));
}

void test_soil_raw_1023_is_0_percent() {
    TEST_ASSERT_EQUAL(0, soilMoisturePercent(1023));
}

void test_soil_midpoint_511_is_50_percent() {
    // map(511, 1023, 0, 0, 100) → integer-truncates to exactly 50
    TEST_ASSERT_EQUAL(50, soilMoisturePercent(511));
}

void test_soil_midpoint_512_truncates_to_49_percent() {
    // integer division floors: (512-1023)*100 / (0-1023) = 51100/1023 = 49
    TEST_ASSERT_EQUAL(49, soilMoisturePercent(512));
}

void test_soil_raw_818_gives_20_percent() {
    // 20% is the "dry soil" critical threshold in the backend.
    // map(818, 1023, 0, 0, 100) = (818-1023)*100 / -1023 = 20
    TEST_ASSERT_EQUAL(20, soilMoisturePercent(818));
}

void test_soil_raw_819_gives_19_percent() {
    // One raw step below 818 crosses below the 20% critical line.
    TEST_ASSERT_EQUAL(19, soilMoisturePercent(819));
}

void test_soil_constrained_below_zero() {
    // raw > 1023 would produce a negative value — must clamp to 0
    TEST_ASSERT_EQUAL(0, soilMoisturePercent(1100));
}

void test_soil_constrained_above_100() {
    // raw < 0 would exceed 100% — must clamp to 100
    TEST_ASSERT_EQUAL(100, soilMoisturePercent(-10));
}

// ─── isMq135Ready ─────────────────────────────────────────────────────────────
// MQ135 needs MQ135_WARMUP_MS to stabilise after power-on.
// The function is given the current millis() and the boot timestamp,
// so it can be tested deterministically without touching hardware time.

void test_mq135_not_ready_one_ms_before_warmup() {
    TEST_ASSERT_FALSE(isMq135Ready(MQ135_WARMUP_MS - 1, 0));
}

void test_mq135_ready_exactly_at_warmup_boundary() {
    TEST_ASSERT_TRUE(isMq135Ready(MQ135_WARMUP_MS, 0));
}

void test_mq135_ready_well_after_warmup() {
    TEST_ASSERT_TRUE(isMq135Ready(MQ135_WARMUP_MS * 2, 0));
}

void test_mq135_uses_boot_time_offset() {
    unsigned long boot = 10000;
    // 29 999 ms elapsed since boot — still not ready
    TEST_ASSERT_FALSE(isMq135Ready(boot + MQ135_WARMUP_MS - 1, boot));
    // exactly MQ135_WARMUP_MS elapsed — ready
    TEST_ASSERT_TRUE(isMq135Ready(boot + MQ135_WARMUP_MS, boot));
}

void test_mq135_handles_millis_rollover() {
    // millis() rolls over after ~49.7 days (ULONG_MAX).
    // Unsigned subtraction wraps correctly, so this must still work.
    unsigned long boot = 0xFFFFFFFF - 5000; // boot 5s before rollover
    unsigned long now  = MQ135_WARMUP_MS - 5000; // now = 25s after rollover
    TEST_ASSERT_TRUE(isMq135Ready(now, boot)); // 30s elapsed total
}

int main() {
    UNITY_BEGIN();

    RUN_TEST(test_soil_raw_0_is_100_percent);
    RUN_TEST(test_soil_raw_1023_is_0_percent);
    RUN_TEST(test_soil_midpoint_511_is_50_percent);
    RUN_TEST(test_soil_midpoint_512_truncates_to_49_percent);
    RUN_TEST(test_soil_raw_818_gives_20_percent);
    RUN_TEST(test_soil_raw_819_gives_19_percent);
    RUN_TEST(test_soil_constrained_below_zero);
    RUN_TEST(test_soil_constrained_above_100);

    RUN_TEST(test_mq135_not_ready_one_ms_before_warmup);
    RUN_TEST(test_mq135_ready_exactly_at_warmup_boundary);
    RUN_TEST(test_mq135_ready_well_after_warmup);
    RUN_TEST(test_mq135_uses_boot_time_offset);
    RUN_TEST(test_mq135_handles_millis_rollover);

    return UNITY_END();
}
