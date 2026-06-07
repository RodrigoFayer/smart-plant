# Backend documentation index

Living index of the backend's documentation. Updated at the end of every TDD cycle.

## Reference specs (written before implementation)

- [Stack & file structure](stack-and-structure.md)
- [Database schema (SQLite)](database.md)
- [MQTT broker structure](broker.md)
- [REST routes & Socket.IO events](api-and-realtime.md)
- [Implementation rules](implementation-rules.md)

## Modules built via TDD

| Module | Doc | Diagram | Status |
|---|---|---|---|
| Plant logic (`calculatePlantState`) | [plant-logic.md](plant-logic.md) | [plant-state.puml](diagrams/plant-state.puml) | done — 17 tests in [test/plantLogic.test.js](../test/plantLogic.test.js) |
| Sensor source (`MockSensorSource`, swappable for the real ESP) | [sensor-source.md](sensor-source.md) | [sensor-source.puml](diagrams/sensor-source.puml) | done — 18 tests in [test/mock/sensorSource.test.js](../test/mock/sensorSource.test.js) |
| MQTT message handlers (`parse<Sensor>`, `dispatchMessage`) | [handlers.md](handlers.md) | [handlers.puml](diagrams/handlers.puml) | done — 55 tests in [test/handlers/](../test/handlers/) |
| In-memory store & state orchestration (`PlantStore`) | [store.md](store.md) | [store.puml](diagrams/store.puml) | done — 12 tests in [test/store.test.js](../test/store.test.js) |
