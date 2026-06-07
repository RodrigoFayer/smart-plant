# Sensor source — mocked data, swappable for the real ESP

Built via TDD — see [`test/mock/sensorSource.test.js`](../test/mock/sensorSource.test.js) for the full spec-as-tests and [`sensor-source.puml`](diagrams/sensor-source.puml) for the swappable-interface diagram.

> Implementation lives in `src/mock/sensorSource.js`. The `mock/` folder groups every "fake but runtime-real" implementation of a swappable interface — e.g. a future `mock/mqttClient.js` would live alongside it, while the real `MqttSensorSource` (once the ESP firmware exists) would live outside `mock/`.

## Why an abstraction

The backend needs sensor data to develop and test against before the ESP firmware exists. Rather than hard-coding mock data into the broker/handlers, sensor data comes from a **source** behind a small interface — today it's `MockSensorSource`, later it'll be `MqttSensorSource` (subscribing to the real `plant/sensors/*` topics). Swapping one for the other requires no change to any consumer code.

## Interface

Every source is an `EventEmitter` exposing:

| Member | Description |
|---|---|
| `on('reading', ({ sensor, data }) => …)` | Emitted whenever a new sensor reading is available |
| `start()` | Begins producing readings |
| `stop()` | Stops producing readings (idempotent, safe to call without a prior `start()`) |

`sensor` is one of `dht11`, `bmp180`, `mq135`, `rain`, `ldr`, `soil`. `data` matches the documented MQTT payload shape for that sensor in [`docs/architecture.md`](../../docs/architecture.md) (e.g. `dht11` → `{ temp, humidity }`, `soil` → `{ moisture }`).

## MockSensorSource

`new MockSensorSource({ interval = 5000 })` emits a `reading` for every known sensor on each tick of `interval` (defaulting to the project's 5-second convention), with randomized-but-plausible values:

| Sensor | Generated data | Range |
|---|---|---|
| `dht11` | `{ temp, humidity }` | temp 18–32°C, humidity 30–80% |
| `bmp180` | `{ pressure, altitude }` | pressure 990–1030 hPa, altitude fixed at 0 |
| `mq135` | `{ ppm }` | 100–900 ppm |
| `rain` | `{ detected }` | boolean, ~10% chance of `true` per tick |
| `ldr` | `{ left, right }` | 0–1023 (10-bit ADC range) |
| `soil` | `{ moisture }` | 0–100% |

## Future: MqttSensorSource

When the ESP firmware is ready, a new source subscribes to the `plant/sensors/*` MQTT topics and re-emits each incoming message as a `reading` with the same `{ sensor, data }` shape — no parsing/validation logic duplicated, since that already lives in the [MQTT handlers](broker.md) layer. The broker wiring in `index.js` picks one source based on configuration (e.g. `.env` flag or `NODE_ENV`).
