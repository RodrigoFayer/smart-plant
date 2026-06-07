# plantLogic.js — Tamagotchi logic

> Seed spec — this doc is expanded as the TDD cycle for `calculatePlantState` proceeds (see [`plant-state.puml`](diagrams/plant-state.puml) for the rule-evaluation diagram once it exists).

The `calculatePlantState(readings)` function receives the latest snapshot of all sensors and returns the current state:

```javascript
// readings = { temp, airHumidity, soilMoisture, lux, ppm, rain, pressure }
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
