# Smart Plant — Smart Plant Pot 🌱

A plant-monitoring system built around an ESP12 (NodeMCU Amica), a Node.js backend with an embedded MQTT broker, and a React Native app. The plant has a Tamagotchi-style "personality" shown on an OLED display.

## Repository structure

```
smart-plant/
├── CLAUDE.md          ← project-wide context
├── docs/              ← detailed project-wide documentation
├── esp/               ← Arduino/C++ firmware for the NodeMCU ESP12
├── backend/           ← Node.js server (MQTT broker + API + WebSocket)
└── frontend/          ← React Native app
```

Each directory has its own `CLAUDE.md` and `docs/` folder with specific details.

## Hardware

| Component | Qty | Use |
|---|---|---|
| NodeMCU ESP12 Amica | 1 | Main microcontroller |
| 0.96" I2C OLED display (SSD1306) | 1 | Tamagotchi + readings |
| DHT11 | 1 | Air temperature and humidity |
| BMP180 | 1 | Atmospheric pressure (I2C) |
| MQ135 | 1 | Air quality (ppm) |
| Rain sensor | 1 | Precipitation detection |
| LDR | 2 | Light level (left and right) |
| HL-69 soil moisture sensor | 1 | Soil moisture (AO + DO) |
| 10k potentiometer | 1 | Fine adjustment / general use |
| Active buzzer | 1 | Sound alerts |
| RGB LED | 2 | General status and alerts |
| Assorted color LEDs | 15 | Soil moisture level bar |
| Push button | 2 | BTN1: mode/mute — BTN2: manual watering |

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
| `plant/sensors/bmp180` | ESP → Backend | `{"pressure": 1013, "altitude": 0}` |
| `plant/sensors/mq135` | ESP → Backend | `{"ppm": 320}` |
| `plant/sensors/rain` | ESP → Backend | `{"detected": true}` |
| `plant/sensors/ldr` | ESP → Backend | `{"left": 680, "right": 540}` |
| `plant/sensors/soil` | ESP → Backend | `{"moisture": 45}` |
| `plant/alerts` | Backend → ESP | `{"type": "critical", "msg": "Soil too dry!"}` |
| `plant/commands` | App → ESP | `{"action": "mute"}` |

## Plant health logic (Tamagotchi)

The plant's state is calculated by the backend by cross-referencing all sensors:

- **Happy**: soil 40–80%, temp 18–28°C, lux > 300, ppm < 400
- **Thirsty**: soil < 30% for more than 30 min
- **Hot**: temp > 35°C
- **No light**: lux < 100 for more than 2h
- **Sick**: 2 or more critical parameters at the same time
- **Sleeping**: between 10pm–7am or night mode active (BTN1)

The state is published via Socket.IO to the app and shown on the ESP's OLED display.

## General conventions

- English everywhere — code, identifiers, domain names, comments, and documentation
- Never commit credentials — use `.env` in every project
- Default sensor reading interval: **5 seconds**

## Components

- [esp/](esp/) — NodeMCU ESP12 firmware (Arduino/C++)
- [backend/](backend/) — Node.js server (MQTT broker + API + WebSocket)
- [frontend/](frontend/) — React Native app
