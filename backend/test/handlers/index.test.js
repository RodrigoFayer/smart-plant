import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dispatchMessage } from '../../src/handlers/index.js'

test('routes a known topic to its handler and returns a normalized reading', () => {
  const result = dispatchMessage('plant/sensors/dht11', JSON.stringify({ temp: 24, humidity: 62 }))
  assert.deepEqual(result, { sensor: 'dht11', data: { temp: 24, humidity: 62 } })
})

test('routes every documented sensor topic to its sensor name and normalized data', () => {
  const cases = [
    ['plant/sensors/dht11',  { temp: 24, humidity: 62 },      'dht11'],
    ['plant/sensors/bmp180', { pressure: 1013, altitude: 0 }, 'bmp180'],
    ['plant/sensors/mq135',  { ppm: 320 },                    'mq135'],
    ['plant/sensors/rain',   { detected: true },              'rain'],
    ['plant/sensors/ldr',    { left: 680, right: 540 },       'ldr'],
    ['plant/sensors/soil',   { moisture: 45 },                'soil'],
  ]

  for (const [topic, payload, sensor] of cases) {
    const result = dispatchMessage(topic, JSON.stringify(payload))
    assert.deepEqual(result, { sensor, data: payload })
  }
})

test('returns null for a topic with no registered handler', () => {
  const result = dispatchMessage('plant/sensors/unknown', JSON.stringify({ foo: 1 }))
  assert.equal(result, null)
})

test('returns null for a topic outside the plant/sensors namespace', () => {
  assert.equal(dispatchMessage('plant/commands', JSON.stringify({ foo: 1 })), null)
  assert.equal(dispatchMessage('plant/alerts', JSON.stringify({ foo: 1 })), null)
})

test('returns null (without throwing) when the payload is empty', () => {
  assert.doesNotThrow(() => {
    const result = dispatchMessage('plant/sensors/dht11', '')
    assert.equal(result, null)
  })
})

test('returns null (without throwing) when the payload is not valid JSON', () => {
  assert.doesNotThrow(() => {
    const result = dispatchMessage('plant/sensors/dht11', '{not valid json')
    assert.equal(result, null)
  })
})

test('returns null when the parsed payload fails the sensor-specific validation', () => {
  const result = dispatchMessage('plant/sensors/dht11', JSON.stringify({ temp: 'hot', humidity: 62 }))
  assert.equal(result, null)
})

test('accepts a Buffer payload, just like Aedes delivers from the wire', () => {
  const result = dispatchMessage('plant/sensors/soil', Buffer.from(JSON.stringify({ moisture: 45 })))
  assert.deepEqual(result, { sensor: 'soil', data: { moisture: 45 } })
})
