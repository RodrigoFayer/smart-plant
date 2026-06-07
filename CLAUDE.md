# Smart Plant — Smart Plant Pot

System for monitoring a plant using an ESP12 (NodeMCU Amica), a Node.js backend with an embedded MQTT broker, and a React Native app. The plant has a Tamagotchi-style "personality" shown on an OLED display.

This file is an orientation guide. Detailed specs live in `docs/`:

- [Project overview & repo structure](docs/overview.md)
- [Available hardware](docs/hardware.md)
- [Architecture & data flow / MQTT topics](docs/architecture.md)
- [Plant health logic (Tamagotchi states)](docs/plant-health.md)
- [General conventions](docs/conventions.md)

Each subproject has its own guide and `docs/` folder:

- [esp/CLAUDE.md](esp/CLAUDE.md) — ESP12 firmware
- [backend/CLAUDE.md](backend/CLAUDE.md) — Node.js backend
- [frontend/CLAUDE.md](frontend/CLAUDE.md) — React Native app
