import { EventEmitter } from 'node:events'
import { calculatePlantState } from './plantLogic.js'

const REQUIRED_SENSORS = ['dht11', 'soil', 'ldr', 'mq135']

function buildSnapshot(readings) {
  const { dht11, soil, ldr, mq135, rain } = readings
  return {
    temp: dht11?.temp,
    airHumidity: dht11?.humidity,
    soilMoisture: soil?.moisture,
    lux: ldr?.lux,
    ppm: mq135?.ppm,
    rain: rain?.detected,
  }
}

function isComplete(readings) {
  return REQUIRED_SENSORS.every((sensor) => sensor in readings)
}

export class PlantStore extends EventEmitter {
  #readings = {}
  #state = null

  ingest({ sensor, data }) {
    const at = Date.now()
    this.#readings[sensor] = { ...data, at }
    this.emit('reading', { sensor, data, at })

    if (!isComplete(this.#readings)) return

    const nextState = calculatePlantState(buildSnapshot(this.#readings))
    const changed = !this.#state || this.#state.state !== nextState.state || this.#state.reason !== nextState.reason
    this.#state = nextState
    if (changed) this.emit('state', nextState)
  }

  getReadings() {
    return { ...this.#readings }
  }

  getState() {
    return this.#state
  }
}
