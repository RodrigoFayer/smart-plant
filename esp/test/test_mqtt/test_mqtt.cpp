#include <unity.h>
#include <string.h>
#include "mqtt.h"

void setUp() {}
void tearDown() {}

// ─── buildTopic ───────────────────────────────────────────────────────────────

void test_topic_dht11() {
    char buf[64];
    buildTopic(buf, sizeof(buf), "dht11");
    TEST_ASSERT_EQUAL_STRING("plant/sensors/dht11", buf);
}

void test_topic_soil() {
    char buf[64];
    buildTopic(buf, sizeof(buf), "soil");
    TEST_ASSERT_EQUAL_STRING("plant/sensors/soil", buf);
}

void test_topic_all_sensors() {
    const char* sensors[] = { "dht11", "bmp180", "mq135", "rain", "ldr", "soil" };
    const char* expected[] = {
        "plant/sensors/dht11",
        "plant/sensors/bmp180",
        "plant/sensors/mq135",
        "plant/sensors/rain",
        "plant/sensors/ldr",
        "plant/sensors/soil",
    };
    char buf[64];
    for (int i = 0; i < 6; i++) {
        buildTopic(buf, sizeof(buf), sensors[i]);
        TEST_ASSERT_EQUAL_STRING(expected[i], buf);
    }
}

// ─── buildPayloadDht11 ────────────────────────────────────────────────────────

void test_payload_dht11_nominal() {
    char buf[64];
    buildPayloadDht11(buf, sizeof(buf), 24, 62);
    TEST_ASSERT_EQUAL_STRING("{\"temp\":24,\"humidity\":62}", buf);
}

void test_payload_dht11_negative_temp() {
    char buf[64];
    buildPayloadDht11(buf, sizeof(buf), -5, 80);
    TEST_ASSERT_EQUAL_STRING("{\"temp\":-5,\"humidity\":80}", buf);
}

void test_payload_dht11_zero_values() {
    char buf[64];
    buildPayloadDht11(buf, sizeof(buf), 0, 0);
    TEST_ASSERT_EQUAL_STRING("{\"temp\":0,\"humidity\":0}", buf);
}

// ─── buildPayloadBmp180 ───────────────────────────────────────────────────────

void test_payload_bmp180_nominal() {
    char buf[64];
    buildPayloadBmp180(buf, sizeof(buf), 1013, 0);
    TEST_ASSERT_EQUAL_STRING("{\"pressure\":1013,\"altitude\":0}", buf);
}

void test_payload_bmp180_nonzero_altitude() {
    char buf[64];
    buildPayloadBmp180(buf, sizeof(buf), 950, 700);
    TEST_ASSERT_EQUAL_STRING("{\"pressure\":950,\"altitude\":700}", buf);
}

// ─── buildPayloadMq135 ────────────────────────────────────────────────────────

void test_payload_mq135_nominal() {
    char buf[64];
    buildPayloadMq135(buf, sizeof(buf), 320);
    TEST_ASSERT_EQUAL_STRING("{\"ppm\":320}", buf);
}

void test_payload_mq135_above_critical_threshold() {
    // Backend critical threshold is ppm > 700
    char buf[64];
    buildPayloadMq135(buf, sizeof(buf), 701);
    TEST_ASSERT_EQUAL_STRING("{\"ppm\":701}", buf);
}

// ─── buildPayloadRain ─────────────────────────────────────────────────────────

void test_payload_rain_detected() {
    char buf[64];
    buildPayloadRain(buf, sizeof(buf), true);
    TEST_ASSERT_EQUAL_STRING("{\"detected\":true}", buf);
}

void test_payload_rain_not_detected() {
    char buf[64];
    buildPayloadRain(buf, sizeof(buf), false);
    TEST_ASSERT_EQUAL_STRING("{\"detected\":false}", buf);
}

// ─── buildPayloadLdr ─────────────────────────────────────────────────────────

void test_payload_ldr_nominal() {
    char buf[64];
    buildPayloadLdr(buf, sizeof(buf), 680, 540);
    TEST_ASSERT_EQUAL_STRING("{\"left\":680,\"right\":540}", buf);
}

void test_payload_ldr_both_zero() {
    char buf[64];
    buildPayloadLdr(buf, sizeof(buf), 0, 0);
    TEST_ASSERT_EQUAL_STRING("{\"left\":0,\"right\":0}", buf);
}

void test_payload_ldr_max_values() {
    char buf[64];
    buildPayloadLdr(buf, sizeof(buf), 1023, 1023);
    TEST_ASSERT_EQUAL_STRING("{\"left\":1023,\"right\":1023}", buf);
}

// ─── buildPayloadSoil ────────────────────────────────────────────────────────

void test_payload_soil_nominal() {
    char buf[64];
    buildPayloadSoil(buf, sizeof(buf), 45);
    TEST_ASSERT_EQUAL_STRING("{\"moisture\":45}", buf);
}

void test_payload_soil_boundaries() {
    char buf[64];
    buildPayloadSoil(buf, sizeof(buf), 0);
    TEST_ASSERT_EQUAL_STRING("{\"moisture\":0}", buf);

    buildPayloadSoil(buf, sizeof(buf), 100);
    TEST_ASSERT_EQUAL_STRING("{\"moisture\":100}", buf);
}

// ─── buildPayloadCommand ─────────────────────────────────────────────────────

void test_payload_command_mute() {
    char buf[64];
    buildPayloadCommand(buf, sizeof(buf), "mute", 0);
    TEST_ASSERT_EQUAL_STRING("{\"action\":\"mute\"}", buf);
}

void test_payload_command_manual_watering_includes_timestamp() {
    char buf[96];
    buildPayloadCommand(buf, sizeof(buf), "manual_watering", 1720000000UL);
    TEST_ASSERT_EQUAL_STRING("{\"action\":\"manual_watering\",\"timestamp\":1720000000}", buf);
}

void test_payload_command_mute_omits_timestamp_field() {
    char buf[64];
    buildPayloadCommand(buf, sizeof(buf), "mute", 0);
    // timestamp=0 means "no timestamp" — field must not appear in the payload
    TEST_ASSERT_NULL(strstr(buf, "timestamp"));
}

int main() {
    UNITY_BEGIN();

    RUN_TEST(test_topic_dht11);
    RUN_TEST(test_topic_soil);
    RUN_TEST(test_topic_all_sensors);

    RUN_TEST(test_payload_dht11_nominal);
    RUN_TEST(test_payload_dht11_negative_temp);
    RUN_TEST(test_payload_dht11_zero_values);

    RUN_TEST(test_payload_bmp180_nominal);
    RUN_TEST(test_payload_bmp180_nonzero_altitude);

    RUN_TEST(test_payload_mq135_nominal);
    RUN_TEST(test_payload_mq135_above_critical_threshold);

    RUN_TEST(test_payload_rain_detected);
    RUN_TEST(test_payload_rain_not_detected);

    RUN_TEST(test_payload_ldr_nominal);
    RUN_TEST(test_payload_ldr_both_zero);
    RUN_TEST(test_payload_ldr_max_values);

    RUN_TEST(test_payload_soil_nominal);
    RUN_TEST(test_payload_soil_boundaries);

    RUN_TEST(test_payload_command_mute);
    RUN_TEST(test_payload_command_manual_watering_includes_timestamp);
    RUN_TEST(test_payload_command_mute_omits_timestamp_field);

    return UNITY_END();
}
