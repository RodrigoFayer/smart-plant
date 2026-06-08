# mqtt — topic and payload builders

Built via TDD — see [`test/test_mqtt/test_mqtt.cpp`](../test/test_mqtt/test_mqtt.cpp) for the full spec-as-tests and [`mqtt.puml`](diagrams/mqtt.puml) for the publish flow.

> Implementation lives in `src/mqtt.h` / `src/mqtt.cpp`. No PubSubClient or Arduino dependency — pure `snprintf` into caller-supplied buffers, testable on the host native environment.

## Why caller-supplied buffers

Each function writes into a `char* buf` of `size_t size` provided by the caller (stack or static allocation in `main.cpp`). This avoids heap allocation on a microcontroller with ~80 KB RAM and lets the linker guarantee at compile time that the buffers are large enough.

## `buildTopic(buf, size, sensor)`

Writes `plant/sensors/<sensor>` into `buf`. Sensor names match the MQTT topic table in [`docs/architecture.md`](../../docs/architecture.md):

| `sensor` | Result |
|---|---|
| `"dht11"` | `plant/sensors/dht11` |
| `"bmp180"` | `plant/sensors/bmp180` |
| `"mq135"` | `plant/sensors/mq135` |
| `"rain"` | `plant/sensors/rain` |
| `"ldr"` | `plant/sensors/ldr` |
| `"soil"` | `plant/sensors/soil` |

## Payload builders

One function per sensor — each produces the exact JSON shape the backend's `parse<Sensor>()` handler expects:

| Function | Signature | Output |
|---|---|---|
| `buildPayloadDht11` | `(buf, size, int temp, int humidity)` | `{"temp":24,"humidity":62}` |
| `buildPayloadBmp180` | `(buf, size, int pressure, int altitude)` | `{"pressure":1013,"altitude":0}` |
| `buildPayloadMq135` | `(buf, size, int ppm)` | `{"ppm":320}` |
| `buildPayloadRain` | `(buf, size, bool detected)` | `{"detected":true}` |
| `buildPayloadLdr` | `(buf, size, int left, int right)` | `{"left":680,"right":540}` |
| `buildPayloadSoil` | `(buf, size, int moisture)` | `{"moisture":45}` |

`buildPayloadSoil` takes the already-converted moisture percentage from `soilMoisturePercent()` in [`sensors.h`](sensors.md) — not the raw ADC value.

## `buildPayloadCommand(buf, size, action, timestamp)`

Builds a `plant/commands` payload for BTN1/BTN2 events:

```cpp
buildPayloadCommand(buf, sizeof(buf), "mute", 0);
// → {"action":"mute"}

buildPayloadCommand(buf, sizeof(buf), "manual_watering", 1720000000UL);
// → {"action":"manual_watering","timestamp":1720000000}
```

`timestamp = 0` means "no timestamp" — the field is omitted entirely. Only `"manual_watering"` carries a timestamp (the epoch seconds at the moment of the button press).
