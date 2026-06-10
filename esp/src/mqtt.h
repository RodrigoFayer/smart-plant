#ifndef MQTT_H
#define MQTT_H

#include <stddef.h>
#include <stdbool.h>

// Writes "plant/sensors/<sensor>" into buf.
void buildTopic(char* buf, size_t size, const char* sensor);

// One builder per sensor — matches the JSON shapes the backend expects.
void buildPayloadDht11  (char* buf, size_t size, int temp, int humidity);
void buildPayloadMq135  (char* buf, size_t size, int ppm);
void buildPayloadRain   (char* buf, size_t size, bool detected);
void buildPayloadLdr    (char* buf, size_t size, int left, int right);
void buildPayloadSoil   (char* buf, size_t size, int moisture);

// Builds a plant/commands payload.
// Pass timestamp = 0 to omit the field (e.g. for "mute").
void buildPayloadCommand(char* buf, size_t size, const char* action, unsigned long timestamp);

#endif
