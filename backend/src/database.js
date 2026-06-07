import Database from 'better-sqlite3'

const SCHEMA = `
CREATE TABLE IF NOT EXISTS readings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor     TEXT NOT NULL,
  payload    TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS states (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  state      TEXT NOT NULL,
  reason     TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS waterings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  origin     TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_readings_sensor ON readings(sensor, created_at);
CREATE INDEX IF NOT EXISTS idx_states_created  ON states(created_at);
`

export function createDatabase(path) {
  const db = new Database(path)
  db.exec(SCHEMA)

  const insertReadingStmt = db.prepare('INSERT INTO readings (sensor, payload, created_at) VALUES (?, ?, ?)')
  const insertStateStmt = db.prepare('INSERT INTO states (state, reason, created_at) VALUES (?, ?, ?)')
  const insertWateringStmt = db.prepare('INSERT INTO waterings (origin, created_at) VALUES (?, ?)')
  const readingsStmt = db.prepare('SELECT sensor, payload, created_at FROM readings WHERE sensor = ? AND created_at >= ? ORDER BY created_at ASC')
  const latestStateStmt = db.prepare('SELECT state, reason, created_at FROM states ORDER BY created_at DESC LIMIT 1')
  const latestWateringStmt = db.prepare('SELECT origin, created_at FROM waterings ORDER BY created_at DESC LIMIT 1')

  return {
    insertReading({ sensor, data, at }) {
      insertReadingStmt.run(sensor, JSON.stringify(data), at)
    },

    insertState({ state, reason, at }) {
      insertStateStmt.run(state, reason, at)
    },

    insertWatering({ origin, at }) {
      insertWateringStmt.run(origin, at)
    },

    getReadings({ sensor, since }) {
      return readingsStmt.all(sensor, since).map((row) => ({
        sensor: row.sensor,
        data: JSON.parse(row.payload),
        at: row.created_at,
      }))
    },

    getLatestState() {
      const row = latestStateStmt.get()
      return row ? { state: row.state, reason: row.reason, at: row.created_at } : null
    },

    getLatestWatering() {
      const row = latestWateringStmt.get()
      return row ? { origin: row.origin, at: row.created_at } : null
    },

    close() {
      db.close()
    },
  }
}
