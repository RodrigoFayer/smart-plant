# ESP — NodeMCU ESP12 Amica firmware

## Context

C++ firmware for Arduino IDE / PlatformIO. Reads all sensors every 5 seconds, publishes via MQTT, and drives the buzzer/OLED based on the state received from the backend.

This file is an orientation guide. Detailed specs live in `docs/`:

- [Environment & pinout](docs/environment-and-pinout.md)
- [File structure & config.h](docs/structure-and-config.md)
- [Inputs — buttons & soil sensor](docs/inputs.md)
- [Outputs — OLED & Tamagotchi](docs/outputs.md)
- [Implementation rules](docs/implementation-rules.md)
