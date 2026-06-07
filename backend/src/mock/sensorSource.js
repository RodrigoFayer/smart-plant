import { EventEmitter } from 'node:events'

const KNOWN_SENSORS = ['dht11', 'bmp180', 'mq135', 'rain', 'ldr', 'soil']
const DEFAULT_INTERVAL = 5000

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateReading(sensor) {
  switch (sensor) {
    case 'dht11':
      return { temp: randomInt(18, 32), humidity: randomInt(30, 80) }
    case 'bmp180':
      return { pressure: randomInt(990, 1030), altitude: 0 }
    case 'mq135':
      return { ppm: randomInt(100, 900) }
    case 'rain':
      return { detected: Math.random() < 0.1 }
    case 'ldr':
      return { left: randomInt(0, 1023), right: randomInt(0, 1023) }
    case 'soil':
      return { moisture: randomInt(0, 100) }
  }
}

export class MockSensorSource extends EventEmitter {
  constructor({ interval = DEFAULT_INTERVAL } = {}) {
    super()
    this.interval = interval
    this.timer = null
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.#tick(), this.interval)
  }

  stop() {
    if (!this.timer) return
    clearInterval(this.timer)
    this.timer = null
  }

  #tick() {
    for (const sensor of KNOWN_SENSORS) {
      this.emit('reading', { sensor, data: generateReading(sensor) })
    }
  }
}
