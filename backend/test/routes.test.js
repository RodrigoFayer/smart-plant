import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createApp } from '../src/routes/index.js'

function makeStore({ readings = {}, state = null } = {}) {
  return {
    getReadings: () => readings,
    getState: () => state,
  }
}

function makeDb({ readings = [], latestWatering = null } = {}) {
  return {
    getReadings: ({ sensor }) => readings.filter((r) => r.sensor === sensor),
    getLatestWatering: () => latestWatering,
  }
}

async function withServer(store, db, fn) {
  const app = createApp({ store, db })
  const server = createServer(app)
  await new Promise((resolve) => server.listen(0, resolve))
  const { port } = server.address()
  try {
    await fn(`http://localhost:${port}`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

// ─── GET /status ──────────────────────────────────────────────────────────────

test('GET /status returns plant state and sensor readings', async () => {
  const readings = {
    soil: { moisture: 65, at: 1_700_000_000_000 },
    dht11: { temp: 24, humidity: 62, at: 1_700_000_000_000 },
  }
  const state = { state: 'happy', reason: null, color: 'green' }
  const watering = { origin: 'manual_btn', at: 1_699_900_000_000 }

  await withServer(makeStore({ readings, state }), makeDb({ latestWatering: watering }), async (base) => {
    const res = await fetch(`${base}/status`)
    assert.equal(res.status, 200)
    const body = await res.json()

    assert.deepEqual(body.plant, { state: 'happy', reason: null })
    assert.deepEqual(body.sensors, readings)
    assert.deepEqual(body.lastWatering, watering)
  })
})

test('GET /status omits color from the plant field', async () => {
  const state = { state: 'thirsty', reason: 'soil below 30%', color: 'yellow' }

  await withServer(makeStore({ state }), makeDb(), async (base) => {
    const body = await (await fetch(`${base}/status`)).json()
    assert.equal('color' in body.plant, false)
  })
})

test('GET /status returns null plant when state is not yet computed', async () => {
  await withServer(makeStore({ state: null }), makeDb(), async (base) => {
    const body = await (await fetch(`${base}/status`)).json()
    assert.equal(body.plant, null)
  })
})

test('GET /status returns null lastWatering when no watering has been recorded', async () => {
  await withServer(makeStore(), makeDb({ latestWatering: null }), async (base) => {
    const body = await (await fetch(`${base}/status`)).json()
    assert.equal(body.lastWatering, null)
  })
})

// ─── GET /history ─────────────────────────────────────────────────────────────

test('GET /history returns readings for the requested sensor and period', async () => {
  const now = Date.now()
  const dbReadings = [
    { sensor: 'soil', data: { moisture: 45 }, at: now - 1000 },
    { sensor: 'soil', data: { moisture: 50 }, at: now - 500 },
  ]

  await withServer(makeStore(), makeDb({ readings: dbReadings }), async (base) => {
    const body = await (await fetch(`${base}/history?sensor=soil&period=1h`)).json()
    assert.equal(body.length, 2)
    assert.equal(body[0].data.moisture, 45)
  })
})

test('GET /history defaults to 24h when no period is supplied', async () => {
  const captured = []
  const db = {
    getReadings: ({ sensor, since }) => { captured.push({ sensor, since }); return [] },
    getLatestWatering: () => null,
  }

  await withServer(makeStore(), db, async (base) => {
    await fetch(`${base}/history?sensor=soil`)
    assert.equal(captured.length, 1)
    assert.equal(captured[0].sensor, 'soil')
    assert.ok(captured[0].since > Date.now() - 24 * 3600 * 1000 - 100)
    assert.ok(captured[0].since < Date.now())
  })
})

test('GET /history passes the correct "since" timestamp for each valid period', async () => {
  const PERIODS = { '1h': 3600, '24h': 86400, '7d': 604800, '30d': 2592000 }

  for (const [period, seconds] of Object.entries(PERIODS)) {
    const captured = []
    const db = {
      getReadings: ({ sensor, since }) => { captured.push(since); return [] },
      getLatestWatering: () => null,
    }

    await withServer(makeStore(), db, async (base) => {
      await fetch(`${base}/history?sensor=soil&period=${period}`)
      const expectedSince = Date.now() - seconds * 1000
      assert.ok(Math.abs(captured[0] - expectedSince) < 200, `period ${period}: since off by too much`)
    })
  }
})

test('GET /history returns 400 when sensor param is missing', async () => {
  await withServer(makeStore(), makeDb(), async (base) => {
    const res = await fetch(`${base}/history?period=1h`)
    assert.equal(res.status, 400)
  })
})

test('GET /history returns 400 when period is not one of the accepted values', async () => {
  await withServer(makeStore(), makeDb(), async (base) => {
    const res = await fetch(`${base}/history?sensor=soil&period=2h`)
    assert.equal(res.status, 400)
  })
})
