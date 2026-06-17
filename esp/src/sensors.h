#ifndef SENSORS_H
#define SENSORS_H

#include <stdint.h>

// MQ135 stabilisation time after power-on (ms)
static const unsigned long MQ135_WARMUP_MS = 30000;

// ADS1115 full-scale count for a single-ended read (16-bit, sign bit unused → 0..32767).
static const int ADS_FULL_SCALE = 32767;

// MQ135 ppm span the raw scale is linearly mapped onto (approximate, uncalibrated).
static const int MQ135_PPM_MAX = 2000;

// Normalises an ADS1115 single-ended count (0..ADS_FULL_SCALE) to the 0..1023 "raw10"
// domain shared by every conversion below, so one calibration scale serves all sensors.
int adsToRaw10(int16_t counts);

// Converts the HL-69 reading (raw10, 0–1023) to soil moisture percent (0–100).
// HL-69 is inversely proportional: dry = high reading, wet = low reading.
int soilMoisturePercent(int raw);

// Converts an LDR voltage-divider reading (raw10, 0–1023) to a 0–1000 lux scale.
// Inverted: a high reading means darkness (low lux), a low reading means bright light.
int ldrLux(int raw);

// Converts an MQ135 reading (raw10, 0–1023) to an approximate ppm (0..MQ135_PPM_MAX).
// Simple linear scale — enough for the backend's ppm>700 "polluted air" trigger.
int mq135Ppm(int raw);

// Returns true once MQ135_WARMUP_MS has elapsed since bootTime.
// Takes explicit timestamps so it can be tested without touching hardware time.
bool isMq135Ready(unsigned long now, unsigned long bootTime);

#endif
