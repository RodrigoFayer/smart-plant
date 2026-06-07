import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PlantStore } from '../src/store.js'

test('starts with no readings and no state', () => {
  const store = new PlantStore()
  assert.deepEqual(store.getReadings(), {})
  assert.equal(store.getState(), null)
})

test('ingest() records the latest reading per sensor, timestamped', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1_700_000_000_000 })
  const store = new PlantStore()

  store.ingest({ sensor: 'soil', data: { moisture: 45 } })

  assert.deepEqual(store.getReadings(), {
    soil: { moisture: 45, at: 1_700_000_000_000 },
  })
})

test('ingest() overwrites the previous reading for the same sensor', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1_700_000_000_000 })
  const store = new PlantStore()

  store.ingest({ sensor: 'soil', data: { moisture: 45 } })
  t.mock.timers.tick(5_000)
  store.ingest({ sensor: 'soil', data: { moisture: 40 } })

  assert.deepEqual(store.getReadings(), {
    soil: { moisture: 40, at: 1_700_000_005_000 },
  })
})

test('ingest() keeps the latest reading of every sensor independently', () => {
  const store = new PlantStore()

  store.ingest({ sensor: 'soil', data: { moisture: 45 } })
  store.ingest({ sensor: 'dht11', data: { temp: 24, humidity: 62 } })

  const readings = store.getReadings()
  assert.equal(readings.soil.moisture, 45)
  assert.equal(readings.dht11.temp, 24)
  assert.equal(readings.dht11.humidity, 62)
})

test('ingest() emits a "reading" event with { sensor, data, at }', (t) => {
  t.mock.timers.enable({ apis: ['Date'], now: 1_700_000_000_000 })
  const store = new PlantStore()
  const onReading = t.mock.fn()
  store.on('reading', onReading)

  store.ingest({ sensor: 'soil', data: { moisture: 45 } })

  assert.equal(onReading.mock.calls.length, 1)
  assert.deepEqual(onReading.mock.calls[0].arguments[0], {
    sensor: 'soil',
    data: { moisture: 45 },
    at: 1_700_000_000_000,
  })
})

test('getState() stays null until temp, soilMoisture, lux and ppm have all reported at least once', () => {
  const store = new PlantStore()

  store.ingest({ sensor: 'soil', data: { moisture: 45 } })
  assert.equal(store.getState(), null)

  store.ingest({ sensor: 'dht11', data: { temp: 24, humidity: 62 } })
  assert.equal(store.getState(), null)

  store.ingest({ sensor: 'mq135', data: { ppm: 320 } })
  assert.equal(store.getState(), null)

  store.ingest({ sensor: 'ldr', data: { left: 680, right: 540 } })
  assert.notEqual(store.getState(), null)
})

test('getState() reflects calculatePlantState over the derived snapshot once complete', () => {
  const store = new PlantStore()

  store.ingest({ sensor: 'soil', data: { moisture: 65 } })
  store.ingest({ sensor: 'dht11', data: { temp: 24, humidity: 62 } })
  store.ingest({ sensor: 'mq135', data: { ppm: 320 } })
  store.ingest({ sensor: 'ldr', data: { left: 200, right: 200 } })

  assert.deepEqual(store.getState(), { state: 'happy', reason: null, color: 'green' })
})

test('getState() recomputes from the latest reading of each sensor as new data arrives', () => {
  const store = new PlantStore()
  store.ingest({ sensor: 'soil', data: { moisture: 65 } })
  store.ingest({ sensor: 'dht11', data: { temp: 24, humidity: 62 } })
  store.ingest({ sensor: 'mq135', data: { ppm: 320 } })
  store.ingest({ sensor: 'ldr', data: { left: 200, right: 200 } })
  assert.equal(store.getState().state, 'happy')

  store.ingest({ sensor: 'soil', data: { moisture: 15 } })
  assert.equal(store.getState().state, 'thirsty')
})

test('derives lux from the ldr raw readings by inverting and scaling their average', () => {
  const store = new PlantStore()
  store.ingest({ sensor: 'soil', data: { moisture: 65 } })
  store.ingest({ sensor: 'dht11', data: { temp: 24, humidity: 62 } })
  store.ingest({ sensor: 'mq135', data: { ppm: 320 } })

  // avg(680, 540) = 610 → ((1023 - 610) / 1023) * 1000 ≈ 403.7 → 404
  store.ingest({ sensor: 'ldr', data: { left: 680, right: 540 } })

  // lux 404 keeps the plant out of "noLight" (< 100), all else nominal → happy
  assert.deepEqual(store.getState(), { state: 'happy', reason: null, color: 'green' })

  // pitch dark: avg(1023, 1023) = 1023 → lux = 0 → "noLight"
  store.ingest({ sensor: 'ldr', data: { left: 1023, right: 1023 } })
  assert.equal(store.getState().state, 'noLight')
})

test('emits a "state" event with the new state whenever the computed state changes', () => {
  const store = new PlantStore()
  const states = []
  store.on('state', (state) => states.push(state))

  store.ingest({ sensor: 'soil', data: { moisture: 65 } })
  store.ingest({ sensor: 'dht11', data: { temp: 24, humidity: 62 } })
  store.ingest({ sensor: 'mq135', data: { ppm: 320 } })
  store.ingest({ sensor: 'ldr', data: { left: 200, right: 200 } })

  assert.equal(states.length, 1)
  assert.deepEqual(states[0], { state: 'happy', reason: null, color: 'green' })

  store.ingest({ sensor: 'soil', data: { moisture: 15 } })

  assert.equal(states.length, 2)
  assert.deepEqual(states[1], { state: 'thirsty', reason: 'soil below 30%', color: 'yellow' })
})

test('does not emit a "state" event when the recomputed state is unchanged', () => {
  const store = new PlantStore()
  const states = []
  store.on('state', (state) => states.push(state))

  store.ingest({ sensor: 'soil', data: { moisture: 65 } })
  store.ingest({ sensor: 'dht11', data: { temp: 24, humidity: 62 } })
  store.ingest({ sensor: 'mq135', data: { ppm: 320 } })
  store.ingest({ sensor: 'ldr', data: { left: 200, right: 200 } })
  assert.equal(states.length, 1)

  // another soil reading, still well within the "happy" range — same state, same reason
  store.ingest({ sensor: 'soil', data: { moisture: 60 } })
  assert.equal(states.length, 1)
})

test('emits a "state" event when the reason changes even if the state name stays the same', () => {
  const store = new PlantStore()
  const states = []
  store.on('state', (state) => states.push(state))

  // dry soil + critical temperature → sick, two critical params
  store.ingest({ sensor: 'soil', data: { moisture: 15 } })
  store.ingest({ sensor: 'dht11', data: { temp: 39, humidity: 62 } })
  store.ingest({ sensor: 'mq135', data: { ppm: 320 } })
  store.ingest({ sensor: 'ldr', data: { left: 200, right: 200 } })
  assert.deepEqual(states.at(-1), {
    state: 'sick',
    reason: 'dry soil, critical temperature',
    color: 'red',
  })

  // air also turns polluted → still "sick", but the joined reason now differs
  store.ingest({ sensor: 'mq135', data: { ppm: 800 } })
  assert.deepEqual(states.at(-1), {
    state: 'sick',
    reason: 'dry soil, critical temperature, polluted air',
    color: 'red',
  })
  assert.equal(states.length, 2)
})
