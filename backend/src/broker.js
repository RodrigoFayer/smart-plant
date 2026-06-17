import { Aedes } from 'aedes'
import { createServer } from 'node:net'
import { dispatchMessage } from './handlers/index.js'

export function handlePublish(packet, client, { store, db }) {
  if (!client) return

  if (packet.topic === 'plant/commands') {
    handleCommand(packet.payload, { store, db })
    return
  }

  const reading = dispatchMessage(packet.topic, packet.payload)
  if (!reading) return
  store.ingest(reading)
  db.insertReading({ sensor: reading.sensor, data: reading.data, at: Date.now() })
}

// Handles ESP → backend commands (plant/commands). Currently only manual
// watering from BTN2: persist it and announce it on the store event bus so the
// socket layer can push a watering:logged event to the app.
function handleCommand(rawPayload, { store, db }) {
  let payload
  try {
    payload = JSON.parse(rawPayload.toString())
  } catch {
    return
  }
  if (payload?.action !== 'manual_watering') return

  const watering = { origin: 'manual_btn', at: Date.now() }
  db.insertWatering(watering)
  store.emit('watering', watering)
}

export async function startBroker(port, { store, db }) {
  const broker = new Aedes()
  await broker.listen()
  const server = createServer(broker.handle)

  broker.on('publish', (packet, client) => {
    handlePublish(packet, client, { store, db })
  })

  // Forward the calculated plant state back to the ESP so its OLED/Tamagotchi
  // reflects the same state shown in the backend/app.
  store.on('state', ({ state, reason }) => {
    broker.publish({
      topic: 'plant/state',
      payload: JSON.stringify({ state, reason }),
      qos: 0,
      retain: true,
    }, () => {})
  })

  await new Promise((resolve) => server.listen(port, resolve))
  console.log(`MQTT broker listening on port ${port}`)

  return { broker, server }
}
