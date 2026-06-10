import { Aedes } from 'aedes'
import { createServer } from 'node:net'
import { dispatchMessage } from './handlers/index.js'

export function handlePublish(packet, client, { store, db }) {
  if (!client) return
  const reading = dispatchMessage(packet.topic, packet.payload)
  if (!reading) return
  store.ingest(reading)
  db.insertReading({ sensor: reading.sensor, data: reading.data, at: Date.now() })
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
