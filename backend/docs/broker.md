# broker.js — MQTT broker

Embedded [Aedes](https://github.com/moscajs/aedes) broker. Every publish from the
ESP is routed by `handlePublish`:

```javascript
export function handlePublish(packet, client, { store, db }) {
  if (!client) return // ignore the broker's own internal messages

  if (packet.topic === 'plant/commands') {
    handleCommand(packet.payload, { store, db })
    return
  }

  // dispatchMessage parses and validates the raw payload itself —
  // malformed JSON from the ESP returns null instead of throwing.
  const reading = dispatchMessage(packet.topic, packet.payload)
  if (!reading) return
  store.ingest(reading)
  db.insertReading({ sensor: reading.sensor, data: reading.data, at: Date.now() })
}
```

## Topics handled

| Topic | Direction | Handling |
|---|---|---|
| `plant/sensors/*` | ESP → Backend | Parsed by `dispatchMessage`, ingested into the store and persisted. |
| `plant/commands` | ESP → Backend | `manual_watering` → `db.insertWatering({ origin: 'manual_btn', at })` and `store.emit('watering', …)`. Other actions are ignored. |
| `plant/state` | Backend → ESP | Published (retained) whenever the store recomputes the plant state. |

## Manual watering (BTN2)

When BTN2 on the ESP is pressed it publishes
`plant/commands {"action":"manual_watering","timestamp":<epoch>}`. The broker
persists the watering and re-announces it on the **store event bus**
(`store.emit('watering', { origin, at })`). The socket layer
([socket.js](../src/socket.js)) listens for that event and pushes a
`watering:logged` Socket.IO event to the app, which updates the "Last watering"
card live. A freshly-opened app reads the latest watering from `GET /status`
(`lastWatering`).
