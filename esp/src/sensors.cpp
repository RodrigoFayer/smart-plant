#include "sensors.h"
#include "Arduino.h"

int adsToRaw10(int16_t counts) {
    if (counts < 0) counts = 0; // single-ended reads should never be negative
    long raw10 = map(counts, 0, ADS_FULL_SCALE, 0, 1023);
    return constrain(raw10, 0, 1023);
}

int soilMoisturePercent(int raw) {
    int pct = map(raw, 1023, 0, 0, 100);
    return constrain(pct, 0, 100);
}

int ldrLux(int raw) {
    int lux = map(raw, 1023, 0, 0, 1000);
    return constrain(lux, 0, 1000);
}

int mq135Ppm(int raw) {
    int ppm = map(raw, 0, 1023, 0, MQ135_PPM_MAX);
    return constrain(ppm, 0, MQ135_PPM_MAX);
}

bool isMq135Ready(unsigned long now, unsigned long bootTime) {
    return (now - bootTime) >= MQ135_WARMUP_MS;
}
