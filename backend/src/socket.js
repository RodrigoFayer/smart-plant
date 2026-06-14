import { Server } from 'socket.io'

export function createSocketServer(httpServer, store) {
  const io = new Server(httpServer, { cors: { origin: '*' } })

  io.on('connection', (socket) => {
    for (const [sensor, { at, ...data }] of Object.entries(store.getReadings())) {
      socket.emit('sensor:update', { sensor, data, at })
    }

    const state = store.getState()
    if (state) socket.emit('plant:state', state)
  })

  store.on('reading', ({ sensor, data, at }) => {
    io.emit('sensor:update', { sensor, data, at })
  })

  store.on('state', ({ state, reason, color }) => {
    io.emit('plant:state', { state, reason, color })
  })

  return io
}
