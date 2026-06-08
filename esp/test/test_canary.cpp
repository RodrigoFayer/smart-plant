#include <unity.h>

void setUp() {}
void tearDown() {}

void test_toolchain_works() {
    TEST_ASSERT_EQUAL(2, 1 + 1);
}

int main() {
    UNITY_BEGIN();
    RUN_TEST(test_toolchain_works);
    return UNITY_END();
}
