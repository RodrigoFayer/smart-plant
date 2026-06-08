# ESP firmware — documentation index

Living index of the ESP firmware's documentation. Updated at the end of every TDD cycle.

## Reference specs (written before implementation)

- [Environment & pinout](environment-and-pinout.md)
- [File structure & config.h](structure-and-config.md)
- [Inputs — buttons & soil sensor](inputs.md)
- [Outputs — LEDs, OLED & Tamagotchi](outputs.md)
- [Implementation rules](implementation-rules.md)

## Testing approach

Pure-logic modules (sensor math, MQTT payload building, LED mapping, button debounce) are tested with **Unity** via PlatformIO's `native` environment — they compile and run on the host without any Arduino SDK. Hardware-dependent wiring (`main.cpp`) is verified on the device.

Run the test suite:
```
python3 -m platformio test -e native
```

## Modules built via TDD

| Module | Doc | Diagram | Status |
|---|---|---|---|
| Sensor math (`soilMoisturePercent`, `isMq135Ready`) | [sensors.md](sensors.md) | — | done — 13 tests in [test/test_sensors/test_sensors.cpp](../test/test_sensors/test_sensors.cpp) |
| MQTT builders (`buildTopic`, `buildPayload*`, `buildPayloadCommand`) | [mqtt.md](mqtt.md) | [mqtt.puml](diagrams/mqtt.puml) | done — 21 tests in [test/test_mqtt/test_mqtt.cpp](../test/test_mqtt/test_mqtt.cpp) |
