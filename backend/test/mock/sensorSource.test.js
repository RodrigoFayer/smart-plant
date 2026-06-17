import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MockSensorSource } from '../../src/mock/sensorSource.js'

const KNOWN_SENSORS = ['dht11', 'mq135', 'rain', 'ldr', 'soil']

const SHAPE_BY_SENSOR = {
  dht11:  (data) => assert.deepEqual(Object.keys(data).sort(), ['humidity', 'temp']),
  mq135:  (data) => assert.deepEqual(Object.keys(data).sort(), ['ppm']),
  rain:   (data) => assert.deepEqual(Object.keys(data).sort(), ['detected']),
  ldr:    (data) => assert.deepEqual(Object.keys(data).sort(), ['lux']),
  soil:   (data) => assert.deepEqual(Object.keys(data).sort(), ['moisture']),
}

function withMockSource(t, options, run) {
  t.mock.timers.enable({ apis: ['setInterval'] })
  const source = new MockSensorSource(options)
  const received = []
  source.on('reading', (reading) => received.push(reading))
  return run({ source, received })
}

test('does not emit anything before start() is called', (t) => {
  withMockSource(t, {}, ({ received }) => {
    t.mock.timers.tick(20000)
    assert.equal(received.length, 0)
  })
})

test('emits one reading per known sensor on each tick of the interval', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    t.mock.timers.tick(5000)

    assert.deepEqual(received.map(r => r.sensor).sort(), [...KNOWN_SENSORS].sort())
  })
})

test('keeps emitting on every subsequent tick', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    t.mock.timers.tick(5000)
    t.mock.timers.tick(5000)
    t.mock.timers.tick(5000)

    assert.equal(received.length, KNOWN_SENSORS.length * 3)
  })
})

test('respects a configurable interval', (t) => {
  withMockSource(t, { interval: 1000 }, ({ source, received }) => {
    source.start()
    t.mock.timers.tick(999)
    assert.equal(received.length, 0)

    t.mock.timers.tick(1)
    assert.equal(received.length, KNOWN_SENSORS.length)
  })
})

test('defaults to a 5-second interval when none is given (matches the project convention)', (t) => {
  withMockSource(t, {}, ({ source, received }) => {
    source.start()
    t.mock.timers.tick(4999)
    assert.equal(received.length, 0)

    t.mock.timers.tick(1)
    assert.equal(received.length, KNOWN_SENSORS.length)
  })
})

test('stop() halts further emissions', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    t.mock.timers.tick(5000)
    const countAfterFirstTick = received.length

    source.stop()
    t.mock.timers.tick(20000)

    assert.equal(received.length, countAfterFirstTick)
  })
})

test('stop() without a prior start() is a safe no-op', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    assert.doesNotThrow(() => source.stop())
    t.mock.timers.tick(20000)
    assert.equal(received.length, 0)
  })
})

test('start() after stop() resumes emissions', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    t.mock.timers.tick(5000)
    source.stop()
    t.mock.timers.tick(20000)

    const countWhileStopped = received.length

    source.start()
    t.mock.timers.tick(5000)

    assert.equal(received.length, countWhileStopped + KNOWN_SENSORS.length)
  })
})

test('start() is idempotent — calling it twice does not speed up emissions', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    source.start()
    t.mock.timers.tick(5000)

    assert.equal(received.length, KNOWN_SENSORS.length)
  })
})

test('every reading has the { sensor, data } shape with a known sensor name', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    t.mock.timers.tick(5000)

    for (const reading of received) {
      assert.deepEqual(Object.keys(reading).sort(), ['data', 'sensor'])
      assert.ok(KNOWN_SENSORS.includes(reading.sensor), `unexpected sensor: ${reading.sensor}`)
    }
  })
})

for (const sensor of KNOWN_SENSORS) {
  test(`"${sensor}" reading data matches the documented MQTT payload shape`, (t) => {
    withMockSource(t, { interval: 5000 }, ({ source, received }) => {
      source.start()
      t.mock.timers.tick(5000)

      const reading = received.find(r => r.sensor === sensor)
      assert.ok(reading, `no reading emitted for "${sensor}"`)
      SHAPE_BY_SENSOR[sensor](reading.data)
    })
  })
}

test('generates plausible values within documented ranges across many ticks', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    for (let i = 0; i < 50; i++) t.mock.timers.tick(5000)

    for (const { sensor, data } of received) {
      switch (sensor) {
        case 'dht11':
          assert.ok(data.temp >= 18 && data.temp <= 32, `temp out of range: ${data.temp}`)
          assert.ok(data.humidity >= 30 && data.humidity <= 80, `humidity out of range: ${data.humidity}`)
          break
        case 'mq135':
          assert.ok(data.ppm >= 100 && data.ppm <= 900, `ppm out of range: ${data.ppm}`)
          break
        case 'rain':
          assert.equal(typeof data.detected, 'boolean')
          break
        case 'ldr':
          assert.ok(data.lux >= 0 && data.lux <= 1000, `lux out of range: ${data.lux}`)
          break
        case 'soil':
          assert.ok(data.moisture >= 0 && data.moisture <= 100, `moisture out of range: ${data.moisture}`)
          break
      }
    }
  })
})

test('generates varying values rather than a fixed constant per sensor', (t) => {
  withMockSource(t, { interval: 5000 }, ({ source, received }) => {
    source.start()
    for (let i = 0; i < 50; i++) t.mock.timers.tick(5000)

    for (const sensor of KNOWN_SENSORS) {
      const values = received.filter(r => r.sensor === sensor).map(r => JSON.stringify(r.data))
      const distinct = new Set(values)
      assert.ok(distinct.size > 1, `expected varying readings for "${sensor}", got the same value ${values.length} times`)
    }
  })
})
