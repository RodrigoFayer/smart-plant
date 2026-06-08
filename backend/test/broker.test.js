import { test } from 'node:test'
import assert from 'node:assert/strict'
import { handlePublish } from '../src/broker.js'

function makeStore() {
  const calls = []
  return { ingest: (reading) => calls.push(reading), calls }
}

function makeDb() {
  const calls = []
  return { insertReading: (row) => calls.push(row), calls }
}

function packet(topic, payload) {
  return { topic, payload: Buffer.from(JSON.stringify(payload)) }
}

test('ignores packets without a client (broker internal messages)', () => {
  const store = makeStore()
  const db = makeDb()

  handlePublish({ topic: 'plant/sensors/soil', payload: Buffer.from('{}') }, null, { store, db })

  assert.equal(store.calls.length, 0)
  assert.equal(db.calls.length, 0)
})

test('dispatches a valid sensor packet to store.ingest and db.insertReading', () => {
  const store = makeStore()
  const db = makeDb()
  const client = { id: 'esp-01' }

  handlePublish(packet('plant/sensors/soil', { moisture: 45 }), client, { store, db })

  assert.equal(store.calls.length, 1)
  assert.deepEqual(store.calls[0], { sensor: 'soil', data: { moisture: 45 } })

  assert.equal(db.calls.length, 1)
  assert.equal(db.calls[0].sensor, 'soil')
  assert.deepEqual(db.calls[0].data, { moisture: 45 })
  assert.equal(typeof db.calls[0].at, 'number')
})

test('skips store.ingest and db.insertReading when the topic is unknown', () => {
  const store = makeStore()
  const db = makeDb()
  const client = { id: 'esp-01' }

  handlePublish(packet('plant/commands', { action: 'mute' }), client, { store, db })

  assert.equal(store.calls.length, 0)
  assert.equal(db.calls.length, 0)
})

test('skips store.ingest and db.insertReading when the payload is malformed', () => {
  const store = makeStore()
  const db = makeDb()
  const client = { id: 'esp-01' }

  handlePublish(
    { topic: 'plant/sensors/soil', payload: Buffer.from('{bad json') },
    client,
    { store, db },
  )

  assert.equal(store.calls.length, 0)
  assert.equal(db.calls.length, 0)
})

test('skips store.ingest and db.insertReading when sensor validation fails', () => {
  const store = makeStore()
  const db = makeDb()
  const client = { id: 'esp-01' }

  handlePublish(packet('plant/sensors/soil', { moisture: 'not a number' }), client, { store, db })

  assert.equal(store.calls.length, 0)
  assert.equal(db.calls.length, 0)
})

test('routes all six documented sensor topics to store.ingest', () => {
  const cases = [
    ['plant/sensors/dht11',  { temp: 24, humidity: 62 },      'dht11'],
    ['plant/sensors/bmp180', { pressure: 1013, altitude: 0 }, 'bmp180'],
    ['plant/sensors/mq135',  { ppm: 320 },                    'mq135'],
    ['plant/sensors/rain',   { detected: true },              'rain'],
    ['plant/sensors/ldr',    { left: 680, right: 540 },       'ldr'],
    ['plant/sensors/soil',   { moisture: 45 },                'soil'],
  ]

  for (const [topic, payload, sensor] of cases) {
    const store = makeStore()
    const db = makeDb()
    const client = { id: 'esp-01' }

    handlePublish(packet(topic, payload), client, { store, db })

    assert.equal(store.calls[0]?.sensor, sensor, `expected sensor '${sensor}' for topic '${topic}'`)
  }
})
