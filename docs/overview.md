# Project overview

## What it is

A plant-monitoring system built around a NodeMCU ESP12 board, a Node.js backend with an embedded MQTT broker, and a React Native app. The plant has a Tamagotchi-style "personality" shown on an OLED display.

## Repository structure

```
smart-plant/
├── CLAUDE.md          ← orientation guide (this area's context)
├── docs/              ← detailed project-wide documentation (this folder)
├── esp/               ← Arduino/C++ firmware for the NodeMCU ESP12
│   ├── CLAUDE.md
│   └── docs/
├── backend/           ← Node.js server (MQTT broker + API + WebSocket)
│   ├── CLAUDE.md
│   └── docs/
└── frontend/          ← React Native app
    ├── CLAUDE.md
    └── docs/
```

Each area (`esp/`, `backend/`, `frontend/`) follows the same pattern: a lean `CLAUDE.md` for orientation, and a `docs/` folder with the detailed specs, decisions, and diagrams.
