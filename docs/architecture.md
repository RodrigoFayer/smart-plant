# Architecture and data flow

## Data flow

```
ESP12
  └─ Wi-Fi / MQTT (port 1883)
        └─ Node.js backend
              ├─ Aedes (embedded MQTT broker)
              ├─ Processes and persists to the database
              └─ Socket.IO → React Native app
```

## MQTT topics

| Topic | Direction | Payload |
|---|---|---|
| `plant/sensors/dht11` | ESP → Backend | `{"temp": 24, "humidity": 62}` |
| `plant/sensors/mq135` | ESP → Backend | `{"ppm": 320}` (real ppm, ADS1115) |
| `plant/sensors/rain` | ESP → Backend | `{"detected": true}` |
| `plant/sensors/ldr` | ESP → Backend | `{"lux": 610}` (single light sensor, lux 0–1000) |
| `plant/sensors/soil` | ESP → Backend | `{"moisture": 45}` |
| `plant/alerts` | Backend → ESP | `{"type": "critical", "msg": "Soil too dry!"}` |
| `plant/commands` | ESP → Backend | `{"action": "manual_watering", "timestamp": 1719900000}` |
