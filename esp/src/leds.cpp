#include "leds.h"
#include <string.h>

LedColor rgbStatusColor(const char* state) {
    if (strcmp(state, "happy")   == 0) return LED_GREEN;
    if (strcmp(state, "thirsty") == 0) return LED_YELLOW;
    if (strcmp(state, "hot")     == 0) return LED_YELLOW;
    if (strcmp(state, "noLight") == 0) return LED_YELLOW;
    if (strcmp(state, "sick")    == 0) return LED_RED;
    return LED_OFF;
}

LedColor rgbAlertColor(bool rain, int temp, int soilMoisture, int ppm) {
    if (temp > 38)          return LED_RED;
    if (ppm > 700)          return LED_PURPLE;
    if (soilMoisture < 20)  return LED_YELLOW;
    if (rain)               return LED_BLUE;
    return LED_OFF;
}

int soilBarSegments(int moisture) {
    if (moisture == 0)  return 0;
    if (moisture <= 20) return 1;
    if (moisture <= 40) return 2;
    if (moisture <= 60) return 3;
    if (moisture <= 80) return 4;
    return 5;
}

LedColor soilBarColor(int moisture) {
    if (moisture == 0)  return LED_OFF;
    if (moisture <= 20) return LED_RED;
    if (moisture <= 60) return LED_YELLOW;
    return LED_GREEN;
}
