#ifndef DISPLAY_H
#define DISPLAY_H

#include <stdint.h>
#include <stdbool.h>

typedef enum {
    EXPR_HAPPY = 0,
    EXPR_THIRSTY,
    EXPR_HOT,
    EXPR_NO_LIGHT,
    EXPR_SICK,
    EXPR_SLEEPING,
} TamagotchiExpr;

TamagotchiExpr stateToExpression(const char* state);
const char*    stateToFooter(const char* state);
int            sensorBarHeight(int value, int minVal, int maxVal, int maxPx);
bool           isNightHour(int hour);
bool           isEconomyTimedOut(unsigned long lastEventAt, unsigned long now, unsigned long timeoutMs);

#endif
