# Backend — Node.js + Aedes + Socket.IO

## Context

Node.js server that centralizes everything: an embedded MQTT broker (Aedes), sensor-data processing, persistence, plant-state (Tamagotchi) calculation, and real-time distribution to the app via Socket.IO.

Built with **TDD**: tests are written first and validated with the user before implementation. Sensor data starts out **mocked**, behind an abstraction that makes it easy to later swap in the real ESP. The project documents itself as it grows — every finished module gets a doc in `docs/` and, where useful, a PlantUML diagram in `docs/diagrams/`. `docs/README.md` is the living index.

This file is an orientation guide. Detailed specs live in `docs/`:

- [Stack & file structure](docs/stack-and-structure.md)
- [Database schema (SQLite)](docs/database.md)
- [MQTT broker structure](docs/broker.md)
- [Plant logic (Tamagotchi state calculation)](docs/plant-logic.md)
- [REST routes & Socket.IO events](docs/api-and-realtime.md)
- [Implementation rules](docs/implementation-rules.md)
