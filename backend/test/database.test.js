import { test } from 'node:test'
import assert from 'node:assert/strict'
import { unlinkSync } from 'node:fs'
import { createDatabase } from '../src/database.js'

function open() {
  return createDatabase(':memory:')
}

test('starts with empty readings, states and waterings', () => {
  const db = open()
  assert.deepEqual(db.getReadings({ sensor: 'soil', since: 0 }), [])
  assert.equal(db.getLatestState(), null)
  assert.equal(db.getLatestWatering(), null)
  db.close()
})

test('insertReading() persists a reading and getReadings() returns it normalized', () => {
  const db = open()

  db.insertReading({ sensor: 'soil', data: { moisture: 45 }, at: 1_700_000_000_000 })

  assert.deepEqual(db.getReadings({ sensor: 'soil', since: 0 }), [
    { sensor: 'soil', data: { moisture: 45 }, at: 1_700_000_000_000 },
  ])
  db.close()
})

test('getReadings() only returns readings for the requested sensor', () => {
  const db = open()

  db.insertReading({ sensor: 'soil', data: { moisture: 45 }, at: 1_700_000_000_000 })
  db.insertReading({ sensor: 'dht11', data: { temp: 24, humidity: 62 }, at: 1_700_000_001_000 })

  const soilReadings = db.getReadings({ sensor: 'soil', since: 0 })
  assert.equal(soilReadings.length, 1)
  assert.equal(soilReadings[0].sensor, 'soil')
})

test('getReadings() only returns readings at or after "since", ordered by time ascending', () => {
  const db = open()

  db.insertReading({ sensor: 'soil', data: { moisture: 10 }, at: 1_000 })
  db.insertReading({ sensor: 'soil', data: { moisture: 20 }, at: 2_000 })
  db.insertReading({ sensor: 'soil', data: { moisture: 30 }, at: 3_000 })

  const readings = db.getReadings({ sensor: 'soil', since: 2_000 })

  assert.deepEqual(readings.map((r) => r.data.moisture), [20, 30])
  assert.deepEqual(readings.map((r) => r.at), [2_000, 3_000])
})

test('getReadings() returns an empty array for a sensor with no readings, even when others have data', () => {
  const db = open()

  db.insertReading({ sensor: 'dht11', data: { temp: 24, humidity: 62 }, at: 1_000 })

  assert.deepEqual(db.getReadings({ sensor: 'soil', since: 0 }), [])
  db.close()
})

test('getLatestState() and getLatestWatering() pick the most recent record by created_at, not insertion order', () => {
  const db = open()

  db.insertState({ state: 'thirsty', reason: 'soil below 30%', at: 5_000 })
  db.insertState({ state: 'happy', reason: null, at: 1_000 }) // inserted later, but an older event

  db.insertWatering({ origin: 'manual_btn', at: 5_000 })
  db.insertWatering({ origin: 'rain', at: 1_000 })

  assert.deepEqual(db.getLatestState(), { state: 'thirsty', reason: 'soil below 30%', at: 5_000 })
  assert.deepEqual(db.getLatestWatering(), { origin: 'manual_btn', at: 5_000 })
  db.close()
})

test('insertState() persists a state and getLatestState() returns the most recent one', () => {
  const db = open()

  db.insertState({ state: 'happy', reason: null, at: 1_000 })
  db.insertState({ state: 'thirsty', reason: 'soil below 30%', at: 2_000 })

  assert.deepEqual(db.getLatestState(), { state: 'thirsty', reason: 'soil below 30%', at: 2_000 })
  db.close()
})

test('insertWatering() persists a watering event and getLatestWatering() returns the most recent one', () => {
  const db = open()

  db.insertWatering({ origin: 'rain', at: 1_000 })
  db.insertWatering({ origin: 'manual_btn', at: 2_000 })

  assert.deepEqual(db.getLatestWatering(), { origin: 'manual_btn', at: 2_000 })
  db.close()
})

test('persists data across instances opened on the same file path', (t) => {
  const path = `/tmp/smart-plant-test-${process.pid}-${Date.now()}.db`
  t.after(() => { try { unlinkSync(path) } catch {} })

  const first = createDatabase(path)
  first.insertReading({ sensor: 'soil', data: { moisture: 45 }, at: 1_700_000_000_000 })
  first.close()

  const second = createDatabase(path)
  assert.deepEqual(second.getReadings({ sensor: 'soil', since: 0 }), [
    { sensor: 'soil', data: { moisture: 45 }, at: 1_700_000_000_000 },
  ])
  second.close()
})
