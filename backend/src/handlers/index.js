import { parseDht11 } from './dht11.js'
import { parseMq135 } from './mq135.js'
import { parseRain } from './rain.js'
import { parseLdr } from './ldr.js'
import { parseSoil } from './soil.js'

const HANDLERS = {
  'plant/sensors/dht11': { sensor: 'dht11', parse: parseDht11 },
  'plant/sensors/mq135': { sensor: 'mq135', parse: parseMq135 },
  'plant/sensors/rain': { sensor: 'rain', parse: parseRain },
  'plant/sensors/ldr': { sensor: 'ldr', parse: parseLdr },
  'plant/sensors/soil': { sensor: 'soil', parse: parseSoil },
}

export function dispatchMessage(topic, rawPayload) {
  const handler = HANDLERS[topic]
  if (!handler) return null

  let payload
  try {
    payload = JSON.parse(rawPayload.toString())
  } catch {
    return null
  }

  const data = handler.parse(payload)
  if (!data) return null

  return { sensor: handler.sensor, data }
}
