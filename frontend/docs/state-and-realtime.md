# State, real-time updates & thresholds

## plantStore.ts — Zustand state shape

```typescript
interface SensorsState {
  dht11:  { temp: number; humidity: number; at: number } | null
  soil:   { moisture: number; at: number } | null
  ldr:    { lux: number; at: number } | null
  mq135:  { ppm: number; at: number } | null
  rain:   { detected: boolean; at: number } | null
  plant:  { state: PlantState; reason: string | null; color: string } | null
  lastWatering: { origin: string; at: number } | null
  alerts: Alert[]
}

type PlantState = 'happy' | 'thirsty' | 'hot' | 'noLight' | 'sick' | 'sleeping'
```

## useSocket.ts — expected structure

```typescript
// Connects to Socket.IO and populates the store automatically
// Reconnects if the connection drops (socket.io-client does this natively)
// Exposes: { connected: boolean }

export function useSocket() {
  const set = usePlantStore(s => s.set)

  useEffect(() => {
    const socket = io(BACKEND_URL)

    socket.on('sensor:update', ({ sensor, data }) => {
      set(state => ({ ...state, [sensor]: data }))
    })

    socket.on('plant:state', (state) => {
      set(s => ({ ...s, plant: state }))
    })

    socket.on('plant:alert', (alert) => {
      set(state => ({ ...state, alerts: [alert, ...state.alerts].slice(0, 10) }))
    })

    return () => socket.disconnect()
  }, [])
}
```

## thresholds.ts — sensor limits

```typescript
// Must mirror the backend's plantLogic.js
export const THRESHOLDS = {
  temp:        { ok: [18, 30],  attention: [10, 35],  unit: '°C' },
  airHumidity: { ok: [40, 70],  attention: [30, 80],  unit: '%'  },
  soilMoisture:{ ok: [40, 80],  attention: [30, 90],  unit: '%'  },
  lux:         { ok: [300, Infinity], attention: [100, Infinity], unit: 'lux' },
  ppm:         { ok: [0, 400],  attention: [0, 600],  unit: 'ppm' },
}

export function calculateStatus(sensor: keyof typeof THRESHOLDS, value: number): 'ok' | 'attention' | 'critical' {
  const t = THRESHOLDS[sensor]
  if (value >= t.ok[0] && value <= t.ok[1]) return 'ok'
  if (value >= t.attention[0] && value <= t.attention[1]) return 'attention'
  return 'critical'
}
```
