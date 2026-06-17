# plantLogic.js — Tamagotchi logic

Built via TDD — see [`test/plantLogic.test.js`](../test/plantLogic.test.js) for the full spec-as-tests and [`plant-state.puml`](diagrams/plant-state.puml) for the rule-evaluation diagram.

The `calculatePlantState(readings)` function receives the latest snapshot of all sensors and returns the current state:

```javascript
// readings = { temp, airHumidity, soilMoisture, lux, ppm, rain }
// returns  = { state, reason, color }

export function calculatePlantState(readings) {
  const { temp, soilMoisture, lux, ppm } = readings
  const critical = []

  if (soilMoisture < 20) critical.push('dry soil')
  if (temp > 38)         critical.push('critical temperature')
  if (ppm > 700)         critical.push('polluted air')
  if (lux < 50)          critical.push('no light')

  if (critical.length >= 2) return { state: 'sick',    reason: critical.join(', '), color: 'red' }
  if (soilMoisture < 30)    return { state: 'thirsty', reason: 'soil below 30%',    color: 'yellow' }
  if (temp > 35)            return { state: 'hot',     reason: 'temp above 35°C',   color: 'orange' }
  if (lux < 100)            return { state: 'noLight', reason: 'low light level',   color: 'purple' }

  return { state: 'happy', reason: null, color: 'green' }
}
```

## Contract

- **Input**: `readings` — latest in-memory snapshot with at least `{ temp, soilMoisture, lux, ppm }` (the function ignores `airHumidity` and `rain`; they exist in the snapshot for other consumers)
- **Output**: `{ state, reason, color }`
  - `state`: one of `'happy' | 'thirsty' | 'hot' | 'noLight' | 'sick'` (the `'sleeping'` state from the [plant-health spec](../../docs/plant-health.md) is **not** decided here — it depends on time-of-day / night mode and is layered on top by the caller)
  - `reason`: `null` for `happy`, a fixed message for single-issue states, or a comma-joined list of critical issues for `sick`
  - `color`: a fixed semantic color per state (`green`, `yellow`, `orange`, `purple`, `red`)

## Rule evaluation order (highest priority first)

| Order | Condition | Result |
|---|---|---|
| 1 | 2+ of: `soilMoisture < 20`, `temp > 38`, `ppm > 700`, `lux < 50` | `sick` — `reason` joins every triggered critical message, in evaluation order (soil → temp → ppm → lux) |
| 2 | `soilMoisture < 30` | `thirsty` |
| 3 | `temp > 35` | `hot` |
| 4 | `lux < 100` | `noLight` |
| 5 | none of the above | `happy` |

Two boundary notes locked in by the tests:
- The "critical" thresholds (20 / 38 / 700 / 50) are strictly more extreme than the "single issue" thresholds (30 / 35 / — / 100), so a parameter is never simultaneously counted as critical and reported as a single-issue state — the priority order naturally resolves it to `sick`.
- Boundary values themselves (e.g. `soilMoisture === 20`, `temp === 35`) fall on the *less severe* side — comparisons are strict (`<`, `>`).
