# Broker, REST API, Socket.IO & entrypoint — final wiring

Built via TDD — see [`test/broker.test.js`](../test/broker.test.js) and [`test/routes.test.js`](../test/routes.test.js) for the full spec-as-tests, and [`wiring.puml`](diagrams/wiring.puml) for the full system flow.

> The four modules in this cycle connect everything built in prior cycles into a running server:
> - `src/broker.js` — Aedes MQTT broker + publish handler
> - `src/routes/index.js` — Express REST routes (`/status`, `/history`)
> - `src/socket.js` — Socket.IO real-time events
> - `src/index.js` — entrypoint that boots and wires everything together

## broker.js

Exports two things:

**`handlePublish(packet, client, { store, db })`** — the pure handler wired to Aedes's `publish` event, extracted so it can be unit-tested without a real MQTT connection:
1. Returns early if `!client` — Aedes fires its own internal publish events (retained messages, heartbeats); those have `client === null` and must be ignored.
2. Calls `dispatchMessage(packet.topic, packet.payload)` — this is the already-tested handler layer that safely parses JSON and validates the payload shape.
3. If the result is non-null, calls `store.ingest(reading)` and `db.insertReading(...)`.

**`startBroker(port, { store, db })`** — starts Aedes + a raw TCP server and wires the publish handler.

## routes/index.js — `createApp({ store, db })`

Returns an Express app (without starting an HTTP server, so tests can inject it into a `node:http` server on a random port):

| Route | Behavior |
|---|---|
| `GET /status` | Returns `{ plant, sensors, lastWatering }`. `plant` is `{ state, reason }` — **`color` is stripped** (it's a display concern for the app, which maps state names to its own colors). `plant` is `null` until all required sensors have reported at least once. |
| `GET /history?sensor=&period=` | Returns readings from SQLite for the given sensor over the given period. `period` defaults to `24h`; accepted values: `1h`, `24h`, `7d`, `30d`. Returns `400` if `sensor` is missing or `period` is not one of the accepted values. |

## socket.js — `createSocketServer(httpServer, store)`

Thin wiring of two `PlantStore` events to Socket.IO broadcasts:

| Store event | Socket.IO event | Payload |
|---|---|---|
| `'reading'` | `sensor:update` | `{ sensor, data, at }` |
| `'state'` | `plant:state` | `{ state, reason, color }` |

`plant:alert` and `watering:logged` events are reserved for a future cycle when watering detection is implemented.

## index.js — entrypoint

Boot order:
1. Open SQLite (`createDatabase`)
2. Create `PlantStore`; wire its `'state'` event → `db.insertState`
3. Create Express app + HTTP server; attach Socket.IO
4. Start Aedes MQTT broker (async)
5. Start `MockSensorSource` (5-second interval); wire its `'reading'` event → `store.ingest` + `db.insertReading`
6. Start HTTP server

**Swapping mock → real ESP**: replace the `MockSensorSource` block with an `MqttSensorSource` that subscribes to `plant/sensors/*` on the same Aedes broker — no other file changes needed.
