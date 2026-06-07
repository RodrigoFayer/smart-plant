# General conventions

- **English everywhere** — code, identifiers, domain names (`soilMoisture`, `plantState`), comments, MQTT payloads, and documentation are all in English.
- Infrastructure and function names follow standard camelCase conventions (`connectMQTT`, `publishSensor`).
- Never commit credentials — use `.env` in every project.
- Default sensor reading interval: **5 seconds**.
- Each area keeps a lean `CLAUDE.md` for orientation; detailed specs, decisions, and diagrams live in that area's `docs/` folder.
