# PlantStore — in-memory readings & state orchestration

Built via TDD — see [`test/store.test.js`](../test/store.test.js) for the full spec-as-tests and [`store.puml`](diagrams/store.puml) for the ingest → snapshot → state flow.

> Implementation lives in `src/store.js`. `PlantStore` is the single source of truth at runtime: it holds the latest reading from every sensor, derives the snapshot `calculatePlantState` needs, and re-emits whenever something a listener (Socket.IO, persistence, …) cares about changes.

## Why this layer exists

`dispatchMessage` (see [`handlers.md`](handlers.md)) hands back one normalized `{ sensor, data }` reading at a time — it has no notion of "the current state of the plant", which requires *all* sensors' latest values together. `PlantStore` is the layer that accumulates those readings into a live snapshot and feeds it to [`calculatePlantState`](plant-logic.md), recomputing the Tamagotchi state as new data arrives.

## API

`new PlantStore()` is an `EventEmitter` exposing:

| Member | Description |
|---|---|
| `ingest({ sensor, data })` | Records the reading as the latest for that sensor (timestamped with `Date.now()` as `at`), then recomputes the plant state if the snapshot is complete |
| `getReadings()` | Returns a snapshot of the latest `{ ...data, at }` per sensor seen so far, e.g. `{ soil: { moisture: 45, at: 1700000000000 }, … }` |
| `getState()` | Returns the current `{ state, reason, color }`, or `null` if not enough sensors have reported yet |
| `on('reading', ({ sensor, data, at }) => …)` | Emitted on every `ingest()` call |
| `on('state', ({ state, reason, color }) => …)` | Emitted only when the computed state actually changes (by `state` name **or** `reason` — see below) |

## Building the snapshot for `calculatePlantState`

Raw sensor payloads don't line up 1:1 with the `{ temp, airHumidity, soilMoisture, lux, ppm, rain, pressure }` shape `calculatePlantState` expects — the store maps them:

| Snapshot field | Derived from |
|---|---|
| `temp`, `airHumidity` | `dht11.temp`, `dht11.humidity` |
| `soilMoisture` | `soil.moisture` |
| `ppm` | `mq135.ppm` |
| `rain` | `rain.detected` |
| `pressure` | `bmp180.pressure` |
| `lux` | derived from `ldr.{left,right}` — see below |

### Deriving `lux` from the LDR

The `ldr` sensor reports raw 10-bit ADC values `{ left, right }` (0–1023), where a **lower** reading means **more** light hitting a typical voltage-divider LDR circuit. The store inverts and scales their average onto a 0–1000 "lux-like" range that the threshold checks in `calculatePlantState` (`lux < 50`, `lux < 100`) can reason about directly:

```javascript
lux = round(((1023 - avg(left, right)) / 1023) * 1000)
```

So `{ left: 1023, right: 1023 }` (pitch dark) → `lux 0`, and `{ left: 0, right: 0 }` (full brightness) → `lux 1000`. This is a relative scale for threshold comparisons, not a calibrated photometric measurement — there's no real lux meter to calibrate against.

## When does `getState()` stop being `null`?

Only once the store has received at least one reading from every sensor `calculatePlantState` actually uses — `dht11`, `soil`, `mq135` and `ldr` (the function ignores `airHumidity`, `rain` and `pressure`, so those aren't required to complete the snapshot). Until then `getState()` returns `null`, so the API/Socket.IO layer can represent "the system just booted, we don't know yet" instead of reporting a misleading `happy`.

## The `'state'` change event

A new `'state'` event fires whenever the *previous* and *next* `{ state, reason }` differ — not just when `state` changes name. This matters because `sick` can be reached through different combinations of critical parameters: going from "dry soil + critical temperature" to "dry soil + critical temperature + polluted air" keeps `state: 'sick'` but changes the `reason` text, and any UI displaying that reason needs to be notified. `color` never differs without `state` also differing, so comparing `state` + `reason` is sufficient.
