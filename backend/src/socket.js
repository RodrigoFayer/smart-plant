import { Server } from 'socket.io'

export function createSocketServer(httpServer, store) {
  const io = new Server(httpServer, { cors: { origin: '*' } })

  store.on('reading', ({ sensor, data, at }) => {
    io.emit('sensor:update', { sensor, data, at })
  })

  store.on('state', ({ state, reason, color }) => {
    io.emit('plant:state', { state, reason, color })
  })

  return io
}
