#include "display.h"
#include "Arduino.h"
#include <string.h>

TamagotchiExpr stateToExpression(const char* state) {
    if (strcmp(state, "thirsty")  == 0) return EXPR_THIRSTY;
    if (strcmp(state, "hot")      == 0) return EXPR_HOT;
    if (strcmp(state, "noLight")  == 0) return EXPR_NO_LIGHT;
    if (strcmp(state, "sick")     == 0) return EXPR_SICK;
    if (strcmp(state, "sleeping") == 0) return EXPR_SLEEPING;
    return EXPR_HAPPY;
}

const char* stateToFooter(const char* state) {
    if (strcmp(state, "thirsty")  == 0) return "I need water...";
    if (strcmp(state, "hot")      == 0) return "It's too hot!";
    if (strcmp(state, "noLight")  == 0) return "I need more light...";
    if (strcmp(state, "sick")     == 0) return "I don't feel well...";
    return "I'm doing great!";
}

int sensorBarHeight(int value, int minVal, int maxVal, int maxPx) {
    int clamped = constrain(value, minVal, maxVal);
    return map(clamped, minVal, maxVal, 0, maxPx);
}

bool isNightHour(int hour) {
    return hour >= 22 || hour <= 6;
}

bool isEconomyTimedOut(unsigned long lastEventAt, unsigned long now, unsigned long timeoutMs) {
    return (now - lastEventAt) >= timeoutMs;
}
