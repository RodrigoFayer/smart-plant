# Stack & file structure

## Stack

- **Framework**: React Native (Expo — managed workflow)
- **Language**: TypeScript
- **Real-time**: socket.io-client
- **Global state**: Zustand
- **Navigation**: Expo Router (file-based routing)
- **Charts**: Victory Native
- **REST requests**: native fetch with React Query (TanStack Query)

## File structure

```
frontend/
├── CLAUDE.md
├── docs/
├── app.json
├── package.json
├── .env.example
├── .env                      ← never commit
├── app/
│   ├── _layout.tsx           ← root layout, Socket.IO provider
│   ├── index.tsx             ← main screen (dashboard + Tamagotchi)
│   ├── history.tsx           ← historical charts per sensor
│   └── settings.tsx          ← settings (server IP, alerts)
├── components/
│   ├── Tamagotchi.tsx        ← animated character (Canvas/SVG)
│   ├── SensorCard.tsx        ← individual sensor card
│   ├── MoistureBar.tsx       ← visual soil-moisture bar
│   ├── SensorChart.tsx       ← line chart (Victory Native)
│   └── AlertBanner.tsx       ← alert banner at the top
├── store/
│   └── plantStore.ts         ← Zustand — global sensor state
├── hooks/
│   ├── useSocket.ts          ← connects Socket.IO and updates the store
│   └── useHistory.ts         ← React Query for historical data
├── services/
│   └── api.ts                ← base URL + fetch functions
└── constants/
    └── thresholds.ts         ← per-sensor limits (mirrors the backend)
```

## .env.example

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000
```

> Use the backend's local IP on the Wi-Fi network. Replace with a public URL in production.
