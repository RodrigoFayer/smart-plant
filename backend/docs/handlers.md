# MQTT message handlers — parsing & routing sensor readings

Built via TDD — see [`test/handlers/sensorParsers.test.js`](../test/handlers/sensorParsers.test.js) and [`test/handlers/index.test.js`](../test/handlers/index.test.js) for the full spec-as-tests, and [`handlers.puml`](diagrams/handlers.puml) for the message-flow diagram.

> Implementation lives in `src/handlers/`: one `parse<Sensor>.js` per sensor plus `index.js` exporting `dispatchMessage`.

## Why this layer exists

The ESP publishes raw MQTT payloads (JSON-encoded strings, delivered as `Buffer`s by Aedes) to topics like `plant/sensors/dht11`. Firmware bugs or transmission noise can produce malformed JSON or payloads with missing/wrong-typed fields — the broker must never crash because of that. This layer is the single place where "untrusted wire data" becomes "trusted normalized readings", so nothing downstream (store, plant logic, Socket.IO) needs to re-validate.

## `parse<Sensor>(payload)`

Six pure functions, one per sensor, each taking an **already-JSON-parsed** value and returning either a normalized `{ ...fields }` object or `null`:

| Function | File | Valid shape | Field types |
|---|---|---|---|
| `parseDht11` | `dht11.js` | `{ temp, humidity }` | both `number` |
| `parseMq135` | `mq135.js` | `{ ppm }` | `number` |
| `parseRain` | `rain.js` | `{ detected }` | `boolean` |
| `parseLdr` | `ldr.js` | `{ lux }` | `number` (lux 0–1000) |
| `parseSoil` | `soil.js` | `{ moisture }` | `number` |

Each function:
- Returns `null` for anything that isn't a plain object (`null`, arrays, primitives, strings).
- Returns `null` if any required field is missing or has the wrong type.
- **Strips unexpected extra fields** — only the documented shape is returned, so the rest of the system never depends on incidental data the firmware happens to send.

## `dispatchMessage(topic, rawPayload)`

The single entry point the broker calls for every published message (see [`broker.md`](broker.md)):

1. Looks up the topic in a `topic → { sensor, parse }` table. Unknown topics (including ones outside `plant/sensors/*`, like `plant/commands`) return `null`.
2. Safely `JSON.parse`s `rawPayload` (accepts both `string` and `Buffer`, matching what Aedes delivers). Malformed or empty payloads return `null` instead of throwing.
3. Runs the topic's `parse<Sensor>` over the parsed payload.
4. Returns `{ sensor, data }` on success, or `null` if any step above failed.

```javascript
dispatchMessage('plant/sensors/dht11', '{"temp":24,"humidity":62}')
// → { sensor: 'dht11', data: { temp: 24, humidity: 62 } }

dispatchMessage('plant/sensors/dht11', '{not valid json')
// → null

dispatchMessage('plant/commands', '{"action":"water"}')
// → null (not a sensor topic)
```

## MQTT topic table

| Topic | Sensor | Handler |
|---|---|---|
| `plant/sensors/dht11` | `dht11` | `parseDht11` |
| `plant/sensors/mq135` | `mq135` | `parseMq135` |
| `plant/sensors/rain` | `rain` | `parseRain` |
| `plant/sensors/ldr` | `ldr` | `parseLdr` |
| `plant/sensors/soil` | `soil` | `parseSoil` |

See [`docs/architecture.md`](../../docs/architecture.md) for the canonical MQTT topic and payload reference.
