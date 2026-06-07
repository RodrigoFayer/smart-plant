import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculatePlantState } from '../src/plantLogic.js'

const baseline = { temp: 24, soilMoisture: 60, lux: 400, ppm: 300 }

test('returns happy when every parameter is within the healthy range', () => {
  const result = calculatePlantState(baseline)
  assert.deepEqual(result, { state: 'happy', reason: null, color: 'green' })
})

test('returns thirsty when soil moisture is below 30% but not critically low', () => {
  const result = calculatePlantState({ ...baseline, soilMoisture: 25 })
  assert.deepEqual(result, { state: 'thirsty', reason: 'soil below 30%', color: 'yellow' })
})

test('returns hot when temperature is above 35°C but not critically high', () => {
  const result = calculatePlantState({ ...baseline, temp: 36 })
  assert.deepEqual(result, { state: 'hot', reason: 'temp above 35°C', color: 'orange' })
})

test('returns noLight when light level is low but not critically low', () => {
  const result = calculatePlantState({ ...baseline, lux: 80 })
  assert.deepEqual(result, { state: 'noLight', reason: 'low light level', color: 'purple' })
})

test('returns sick when soil and temperature are both critical', () => {
  const result = calculatePlantState({ ...baseline, soilMoisture: 15, temp: 39 })
  assert.equal(result.state, 'sick')
  assert.equal(result.color, 'red')
  assert.equal(result.reason, 'dry soil, critical temperature')
})

test('returns sick when light and air quality are both critical', () => {
  const result = calculatePlantState({ ...baseline, lux: 40, ppm: 750 })
  assert.equal(result.state, 'sick')
  assert.equal(result.color, 'red')
  assert.equal(result.reason, 'polluted air, no light')
})

test('always returns an object with state, reason and color', () => {
  const result = calculatePlantState(baseline)
  assert.deepEqual(Object.keys(result).sort(), ['color', 'reason', 'state'])
})

test('returns sick (not just thirsty/hot) when 3 parameters are critical at once', () => {
  const result = calculatePlantState({ ...baseline, soilMoisture: 10, temp: 40, ppm: 800 })
  assert.equal(result.state, 'sick')
  assert.equal(result.color, 'red')
  assert.equal(result.reason, 'dry soil, critical temperature, polluted air')
})

test('prioritizes thirsty over hot when both non-critical issues are present', () => {
  const result = calculatePlantState({ ...baseline, soilMoisture: 25, temp: 36 })
  assert.equal(result.state, 'thirsty')
})

test('prioritizes hot over noLight when both non-critical issues are present', () => {
  const result = calculatePlantState({ ...baseline, temp: 36, lux: 80 })
  assert.equal(result.state, 'hot')
})

test('boundary: soil moisture at exactly 20% is thirsty, not sick', () => {
  const result = calculatePlantState({ ...baseline, soilMoisture: 20 })
  assert.equal(result.state, 'thirsty')
})

test('boundary: soil moisture at exactly 30% is happy, not thirsty', () => {
  const result = calculatePlantState({ ...baseline, soilMoisture: 30 })
  assert.equal(result.state, 'happy')
})

test('boundary: temperature at exactly 38°C is hot, not sick', () => {
  const result = calculatePlantState({ ...baseline, temp: 38 })
  assert.equal(result.state, 'hot')
})

test('boundary: temperature at exactly 35°C is happy, not hot', () => {
  const result = calculatePlantState({ ...baseline, temp: 35 })
  assert.equal(result.state, 'happy')
})

test('boundary: light level at exactly 50 lux is noLight, not sick', () => {
  const result = calculatePlantState({ ...baseline, lux: 50 })
  assert.equal(result.state, 'noLight')
})

test('boundary: light level at exactly 100 lux is happy, not noLight', () => {
  const result = calculatePlantState({ ...baseline, lux: 100 })
  assert.equal(result.state, 'happy')
})

test('boundary: air quality at exactly 700 ppm is not critical on its own', () => {
  const result = calculatePlantState({ ...baseline, ppm: 700 })
  assert.equal(result.state, 'happy')
})
