#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi
const char* WIFI_SSID     = "YOUR_NETWORK";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// MQTT — backend's IP on the local network
const char* MQTT_HOST   = "192.168.1.100";
const int   MQTT_PORT   = 1883;
const char* MQTT_CLIENT = "smart-plant-esp";

// Reading interval (ms)
const int READING_INTERVAL = 5000;

// MQ135 warm-up (ms) — don't publish air-quality readings before this
const int MQ135_WARMUP_MS = 30000;

#endif
