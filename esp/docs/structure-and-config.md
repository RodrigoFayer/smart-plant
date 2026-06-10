# File structure & config

## File structure

```
esp/
├── CLAUDE.md
├── docs/
├── platformio.ini
├── src/
│   ├── main.cpp          ← main setup() and loop()
│   ├── config.h          ← Wi-Fi credentials, broker IP, pins
│   ├── sensors.h / .cpp  ← reads all sensors
│   ├── mqtt.h / .cpp     ← MQTT connection and publishing
│   └── display.h / .cpp  ← OLED and Tamagotchi logic
└── test/
```

## config.h — required variables

```cpp
#ifndef CONFIG_H
#define CONFIG_H

// Wi-Fi
const char* WIFI_SSID     = "YOUR_NETWORK";
const char* WIFI_PASSWORD = "YOUR_PASSWORD";

// MQTT
const char* MQTT_HOST     = "192.168.1.100"; // backend's IP on the local network
const int   MQTT_PORT     = 1883;
const char* MQTT_CLIENT   = "smart-plant-esp";

// Reading interval (ms)
const int READING_INTERVAL = 5000;

#endif
```

> Never commit config.h — add it to .gitignore. Provide config.example.h in the repository.
