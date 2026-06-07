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
    // dispatchMessage parses and validates the raw payload itself —
    // malformed JSON from the ESP returns null instead of throwing.
    const reading = dispatchMessage(packet.topic, packet.payload)
    if (reading) {
      // … hand off to the in-memory store / state calculation (next cycles)
    }
  })

  server.listen(port, () => {
    console.log(`MQTT broker running on port ${port}`)
  })

  return broker
}
```
