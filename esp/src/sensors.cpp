#include "sensors.h"
#include "Arduino.h"

int soilMoisturePercent(int raw) {
    int pct = map(raw, 1023, 0, 0, 100);
    return constrain(pct, 0, 100);
}

bool isMq135Ready(unsigned long now, unsigned long bootTime) {
    return (now - bootTime) >= MQ135_WARMUP_MS;
}
