#ifndef SENSORS_H
#define SENSORS_H

#include <stdint.h>

// MQ135 stabilisation time after power-on (ms)
static const unsigned long MQ135_WARMUP_MS = 30000;

// Converts the HL-69 raw ADC reading (0–1023) to soil moisture percent (0–100).
// HL-69 is inversely proportional: dry = high ADC, wet = low ADC.
int soilMoisturePercent(int raw);

// Returns true once MQ135_WARMUP_MS has elapsed since bootTime.
// Takes explicit timestamps so it can be tested without touching hardware time.
bool isMq135Ready(unsigned long now, unsigned long bootTime);

#endif
