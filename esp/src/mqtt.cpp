#include "mqtt.h"
#include <stdio.h>

void buildTopic(char* buf, size_t size, const char* sensor) {
    snprintf(buf, size, "plant/sensors/%s", sensor);
}

void buildPayloadDht11(char* buf, size_t size, int temp, int humidity) {
    snprintf(buf, size, "{\"temp\":%d,\"humidity\":%d}", temp, humidity);
}

void buildPayloadMq135(char* buf, size_t size, int ppm) {
    snprintf(buf, size, "{\"ppm\":%d}", ppm);
}

void buildPayloadRain(char* buf, size_t size, bool detected) {
    snprintf(buf, size, "{\"detected\":%s}", detected ? "true" : "false");
}

void buildPayloadLdr(char* buf, size_t size, int lux) {
    snprintf(buf, size, "{\"lux\":%d}", lux);
}

void buildPayloadSoil(char* buf, size_t size, int moisture) {
    snprintf(buf, size, "{\"moisture\":%d}", moisture);
}

void buildPayloadCommand(char* buf, size_t size, const char* action, unsigned long timestamp) {
    if (timestamp == 0) {
        snprintf(buf, size, "{\"action\":\"%s\"}", action);
    } else {
        snprintf(buf, size, "{\"action\":\"%s\",\"timestamp\":%lu}", action, timestamp);
    }
}
