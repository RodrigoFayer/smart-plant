import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseDht11 } from '../../src/handlers/dht11.js'
import { parseBmp180 } from '../../src/handlers/bmp180.js'
import { parseMq135 } from '../../src/handlers/mq135.js'
import { parseRain } from '../../src/handlers/rain.js'
import { parseLdr } from '../../src/handlers/ldr.js'
import { parseSoil } from '../../src/handlers/soil.js'

// Each entry validates one handler against: a valid payload (must normalize
// to itself), the same payload with extra unexpected fields (must strip them),
// and a list of payloads that must be rejected with null.
const CASES = [
  {
    sensor: 'dht11',
    parse: parseDht11,
    valid: { temp: 24, humidity: 62 },
    withExtras: { temp: 24, humidity: 62, unit: 'celsius' },
    invalid: [
      {},
      { temp: 24 },
      { humidity: 62 },
      { temp: '24', humidity: 62 },
      { temp: 24, humidity: '62' },
      { temp: null, humidity: 62 },
      null,
      'not an object',
      42,
      [24, 62],
    ],
  },
  {
    sensor: 'bmp180',
    parse: parseBmp180,
    valid: { pressure: 1013, altitude: 0 },
    withExtras: { pressure: 1013, altitude: 0, unit: 'hPa' },
    invalid: [
      {},
      { pressure: 1013 },
      { altitude: 0 },
      { pressure: '1013', altitude: 0 },
      { pressure: 1013, altitude: '0' },
      null,
    ],
  },
  {
    sensor: 'mq135',
    parse: parseMq135,
    valid: { ppm: 320 },
    withExtras: { ppm: 320, raw: 512 },
    invalid: [
      {},
      { ppm: '320' },
      { ppm: null },
      null,
    ],
  },
  {
    sensor: 'rain',
    parse: parseRain,
    valid: { detected: true },
    withExtras: { detected: true, raw: 1 },
    invalid: [
      {},
      { detected: 'true' },
      { detected: 1 },
      { detected: null },
      null,
    ],
  },
  {
    sensor: 'ldr',
    parse: parseLdr,
    valid: { left: 680, right: 540 },
    withExtras: { left: 680, right: 540, unit: 'raw' },
    invalid: [
      {},
      { left: 680 },
      { right: 540 },
      { left: '680', right: 540 },
      { left: 680, right: '540' },
      null,
    ],
  },
  {
    sensor: 'soil',
    parse: parseSoil,
    valid: { moisture: 45 },
    withExtras: { moisture: 45, raw: 612 },
    invalid: [
      {},
      { moisture: '45' },
      { moisture: null },
      null,
    ],
  },
]

for (const { sensor, parse, valid, withExtras, invalid } of CASES) {
  test(`${sensor}: normalizes a valid payload`, () => {
    assert.deepEqual(parse(valid), valid)
  })

  test(`${sensor}: strips unexpected extra fields from the payload`, () => {
    assert.deepEqual(parse(withExtras), valid)
  })

  invalid.forEach((bad, i) => {
    test(`${sensor}: rejects invalid payload #${i + 1} (${JSON.stringify(bad)})`, () => {
      assert.equal(parse(bad), null)
    })
  })
}
