# Stack & file structure

## Stack

- **Runtime**: Node.js 20+
- **MQTT broker**: Aedes
- **REST API**: Express
- **Real-time**: Socket.IO
- **Database**: SQLite (via better-sqlite3) — simple for a prototype
- **ORM / query builder**: native (better-sqlite3 is synchronous, no ORM needed)
- **Language**: JavaScript (ES Modules)
- **Tests**: `node:test` + `node:assert` (built into Node.js, no extra dependency)

## File structure

```
backend/
├── CLAUDE.md
├── docs/
├── package.json
├── .env.example
├── .env                  ← never commit
├── src/
│   ├── index.js          ← entry point — boots everything
│   ├── broker.js         ← Aedes MQTT broker
│   ├── database.js       ← SQLite connection and migrations
│   ├── plantLogic.js     ← calculates the Tamagotchi state
│   ├── mock/
│   │   └── sensorSource.js ← generates mocked readings (swappable for the real ESP)
│   ├── handlers/
│   │   ├── dht11.js      ← processes plant/sensors/dht11
│   │   ├── bmp180.js
│   │   ├── mq135.js
│   │   ├── rain.js
│   │   ├── ldr.js
│   │   └── soil.js
│   ├── routes/
│   │   ├── history.js    ← GET /history?sensor=dht11&period=24h
│   │   └── status.js     ← GET /status (latest state of everything)
│   └── socket.js         ← Socket.IO setup and event emission
├── test/
│   ├── plantLogic.test.js  ← mirrors src/, one test file per module
│   ├── mock/
│   │   └── sensorSource.test.js
│   └── handlers/
│       ├── sensorParsers.test.js
│       └── index.test.js
└── db/
    └── smart-plant.db    ← generated automatically, do not commit
```

## .env.example

```env
PORT_HTTP=3000
PORT_MQTT=1883
DB_PATH=./db/smart-plant.db
```
