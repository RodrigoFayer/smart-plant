import { createServer } from 'node:http'
import { createDatabase } from './database.js'
import { PlantStore } from './store.js'
import { MockSensorSource } from './mock/sensorSource.js'
import { startBroker } from './broker.js'
import { createApp } from './routes/index.js'
import { createSocketServer } from './socket.js'

const PORT_HTTP = Number(process.env.PORT_HTTP) || 3000
const PORT_MQTT = Number(process.env.PORT_MQTT) || 1883
const DB_PATH = process.env.DB_PATH || './db/smart-plant.db'

const db = createDatabase(DB_PATH)
const store = new PlantStore()

// Persist every state change
store.on('state', ({ state, reason }) => {
  db.insertState({ state, reason, at: Date.now() })
})

const app = createApp({ store, db })
const httpServer = createServer(app)
createSocketServer(httpServer, store)

await startBroker(PORT_MQTT, { store, db })

// MockSensorSource feeds the store directly until the real ESP is connected.
// Swap for MqttSensorSource when the ESP firmware is ready.
const source = new MockSensorSource({ interval: 5000 })
source.on('reading', ({ sensor, data }) => {
  store.ingest({ sensor, data })
  db.insertReading({ sensor, data, at: Date.now() })
})
source.start()

httpServer.listen(PORT_HTTP, () => {
  console.log(`HTTP  → http://localhost:${PORT_HTTP}`)
  console.log(`MQTT  → mqtt://localhost:${PORT_MQTT}`)
})
