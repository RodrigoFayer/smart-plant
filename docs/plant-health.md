# Plant health logic (Tamagotchi)

The plant's state is calculated by the backend by cross-referencing all sensors:

- **Happy** (`happy`): soil 40–80%, temp 18–28°C, lux > 300, ppm < 400
- **Thirsty** (`thirsty`): soil < 30% for more than 30 min
- **Hot** (`hot`): temp > 35°C
- **No light** (`noLight`): lux < 100 for more than 2h
- **Sick** (`sick`): 2 or more critical parameters at the same time
- **Sleeping** (`sleeping`): between 10pm–7am or night mode active (BTN1)

The state is published via Socket.IO to the app and shown on the ESP's OLED display.

> Implementation details and the rule-priority order live in [`backend/docs/plant-logic.md`](../backend/docs/plant-logic.md) — that's the living spec, built and refined through TDD.
