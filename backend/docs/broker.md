# broker.js — expected structure

```javascript
import aedes from 'aedes'
import { createServer } from 'net'
import { dispatchMessage } from './handlers/index.js'

export function startBroker(port) {
  const broker = aedes()
  const server = createServer(broker.handle)

  broker.on('publish', (packet, client) => {
    if (!client) return // ignore the broker's internal messages
    const topic = packet.topic
    const payload = JSON.parse(packet.payload.toString())
    dispatchMessage(topic, payload)
  })

  server.listen(port, () => {
    console.log(`MQTT broker running on port ${port}`)
  })

  return broker
}
```
