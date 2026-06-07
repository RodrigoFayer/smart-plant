# Database — SQLite schema

```sql
-- Raw readings from each sensor
CREATE TABLE readings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sensor     TEXT NOT NULL,          -- 'dht11', 'bmp180', etc.
  payload    TEXT NOT NULL,          -- stringified JSON
  created_at INTEGER NOT NULL        -- Unix epoch (Date.now())
);

-- Calculated plant state (history)
CREATE TABLE states (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  state      TEXT NOT NULL,          -- 'happy', 'thirsty', etc.
  reason     TEXT,                   -- 'soil below 20%'
  created_at INTEGER NOT NULL
);

-- Watering events (manual or detected)
CREATE TABLE waterings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  origin     TEXT NOT NULL,          -- 'manual_btn', 'manual_inferred', 'rain'
  created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX idx_readings_sensor ON readings(sensor, created_at);
CREATE INDEX idx_states_created  ON states(created_at);
```
