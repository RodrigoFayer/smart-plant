import { Server } from 'socket.io'

export function createSocketServer(httpServer, store, db) {
  const io = new Server(httpServer, { cors: { origin: '*' } })

  io.on('connection', (socket) => {
    for (const [sensor, { at, ...data }] of Object.entries(store.getReadings())) {
      socket.emit('sensor:update', { sensor, data, at })
    }

    const state = store.getState()
    if (state) socket.emit('plant:state', state)

    const lastWatering = db?.getLatestWatering()
    if (lastWatering) socket.emit('watering:logged', lastWatering)
  })

  store.on('reading', ({ sensor, data, at }) => {
    io.emit('sensor:update', { sensor, data, at })
  })

  store.on('state', ({ state, reason, color }) => {
    io.emit('plant:state', { state, reason, color })
  })

  // Manual watering logged via the MQTT broker (ESP BTN2) → push to the app.
  store.on('watering', (watering) => {
    io.emit('watering:logged', watering)
  })

  return io
}
