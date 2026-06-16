# REST routes & Socket.IO events

## REST routes

### GET /status
Returns the latest value of each sensor and the plant's current state.

```json
{
  "plant": { "state": "happy", "reason": null },
  "sensors": {
    "dht11":  { "temp": 24, "humidity": 62, "at": 1720000000 },
    "soil":   { "moisture": 65, "at": 1720000000 },
    "ldr":    { "lux": 610, "at": 1720000000 },
    "mq135":  { "ppm": 320, "at": 1720000000 },
    "rain":   { "detected": false, "at": 1720000000 }
  },
  "lastWatering": { "origin": "manual_btn", "at": 1719900000 }
}
```

### GET /history
Query params: `sensor` (required), `period` (default: `24h`, accepts `1h`, `7d`, `30d`)

Returns an array of readings for the period, ordered by `created_at` ASC.

## Socket.IO — emitted events

| Event | When | Payload |
|---|---|---|
| `sensor:update` | On every new reading from the ESP | `{ sensor, data, at }` |
| `plant:state` | When the state changes | `{ state, reason, color }` |
| `plant:alert` | When a parameter enters a critical zone | `{ type, message }` |
| `watering:logged` | Watering detected or manual | `{ origin, at }` |
