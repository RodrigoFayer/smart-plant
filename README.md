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
| ADS1115 (16-bit I2C ADC, 4 channels) | 1 | Analog reads for soil, MQ135 and the LDR |
| 0.96" I2C OLED display (SSD1306) | 1 | Tamagotchi + readings |
| DHT11 | 1 | Air temperature and humidity |
| MQ135 | 1 | Air quality (ppm) — analog via ADS1115 |
| Rain sensor | 1 | Precipitation detection (digital) |
| LDR | 1 | Light level — analog (lux) via ADS1115 (channel A3) |
| HL-69 soil moisture sensor | 1 | Soil moisture — analog via ADS1115 |
| Push button | 2 | BTN1: wake/mode — BTN2: manual watering |

> The ESP8266 has a single native ADC (A0), so the three analog sensors share an external
> ADS1115 on the I2C bus (alongside the OLED). See [esp/docs/wiring.md](esp/docs/wiring.md)
> for the full pinout and breadboard layout.

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
