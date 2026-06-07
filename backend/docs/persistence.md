# SQLite persistence

Built via TDD — see [`test/database.test.js`](../test/database.test.js) for the full spec-as-tests and [`persistence.puml`](diagrams/persistence.puml) for how it fits into the data flow.

> Implementation lives in `src/database.js`. The schema itself is documented in [`database.md`](database.md) — this doc covers the `createDatabase(path)` query layer built on top of it.

## Why this layer exists

`PlantStore` (see [`store.md`](store.md)) only ever knows the *latest* reading per sensor and the *current* plant state — that's exactly what `/status` needs, but `/history` and any future trend analysis need everything that has happened over time. `createDatabase` is the layer that durably records every reading, state change and watering event using SQLite (via `better-sqlite3`, synchronous — no ORM needed for a prototype this size), and lets the API query them back out.

## API

`createDatabase(path)` opens (or creates) the database at `path` — pass `':memory:'` for a throwaway instance, e.g. in tests — applies the schema (idempotently, via `CREATE TABLE/INDEX IF NOT EXISTS`, so reopening an existing file is safe) and returns:

| Member | Description |
|---|---|
| `insertReading({ sensor, data, at })` | Stores a normalized reading; `data` is JSON-stringified into the `payload` column |
| `insertState({ state, reason, at })` | Stores a calculated plant state |
| `insertWatering({ origin, at })` | Stores a watering event (`'manual_btn' \| 'manual_inferred' \| 'rain'`) |
| `getReadings({ sensor, since })` | Returns `{ sensor, data, at }[]` for that sensor with `created_at >= since`, ordered ascending — the shape `/history` needs |
| `getLatestState()` | Returns the most recent `{ state, reason, at }`, or `null` if none yet |
| `getLatestWatering()` | Returns the most recent `{ origin, at }`, or `null` if none yet |
| `close()` | Closes the underlying connection |

Every getter deserializes rows back into the same normalized shapes used elsewhere in the system (`{ sensor, data, at }` mirrors what `PlantStore.ingest` receives; `{ state, reason, at }` mirrors `calculatePlantState`'s output plus a timestamp).

## Design notes

- **`at` is supplied by the caller**, not generated here — `PlantStore` already stamps every reading and state change with `Date.now()` when it happens; persistence just durably records that same value. This keeps a single source of truth for "when did this happen" and makes the store/database layers trivially composable (and the tests deterministic, with no `Date` mocking needed).
- **"Latest" means most recent `created_at`**, not highest row id — `getLatestState`/`getLatestWatering` order by `created_at DESC`, so out-of-order inserts (batched writes, backfills) still resolve to the chronologically last event.
- **Readings round-trip through JSON** in the `payload` column (per the schema in [`database.md`](database.md)) — this keeps the table sensor-agnostic; adding a new sensor never requires a migration.
