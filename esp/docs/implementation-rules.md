# Implementation rules

- Never use `delay()` — use `millis()` for non-blocking timing
- Automatically reconnect Wi-Fi and MQTT if the connection drops
- Active watchdog — restart if the loop hangs for more than 8s
- `Serial.begin(115200)` active during debugging — remove verbose prints in the final version
- The MQ135 sensor needs 30s of warm-up after power-on — don't publish readings before that
