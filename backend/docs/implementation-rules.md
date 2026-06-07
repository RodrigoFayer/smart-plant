# Implementation rules

- Keep the latest value of each sensor in memory (`Map` or global object) — don't hit the database on every state calculation
- Recalculate the plant state on every new reading received
- Persist readings to the database asynchronously — don't block the MQTT handler
- Cleanup routine: delete readings older than 30 days (run once a day with `setInterval`)
- Wrap every MQTT payload's `JSON.parse` in try/catch — the ESP can send malformed data
- MQTT port (1883) and HTTP+Socket.IO port (3000) are configurable via `.env`
