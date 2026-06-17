# ESP firmware — documentation index

Living index of the ESP firmware's documentation. Updated at the end of every TDD cycle.

## Reference specs (written before implementation)

- [Environment & pinout](environment-and-pinout.md)
- [Wiring & breadboard layout](wiring.md)
- [File structure & config.h](structure-and-config.md)
- [Inputs — buttons & soil sensor](inputs.md)
- [Outputs — OLED & Tamagotchi](outputs.md)
- [Implementation rules](implementation-rules.md)
- [OTA (wireless firmware update)](ota.md)

## Testing approach

Pure-logic modules (sensor math, MQTT payload building, button debounce, display mapping) are tested with **Unity** via PlatformIO's `native` environment — they compile and run on the host without any Arduino SDK. Hardware-dependent wiring (`main.cpp`) is verified on the device.

Run the test suite:
```
python3 -m platformio test -e native
```

## Modules built via TDD

| Module | Doc | Diagram | Status |
|---|---|---|---|
| Sensor math (`adsToRaw10`, `soilMoisturePercent`, `ldrLux`, `mq135Ppm`, `isMq135Ready`) | [sensors.md](sensors.md) | — | done — 24 tests in [test/test_sensors/test_sensors.cpp](../test/test_sensors/test_sensors.cpp) |
| MQTT builders (`buildTopic`, `buildPayload*`, `buildPayloadCommand`) | [mqtt.md](mqtt.md) | [mqtt.puml](diagrams/mqtt.puml) | done — 18 tests in [test/test_mqtt/test_mqtt.cpp](../test/test_mqtt/test_mqtt.cpp) |
| Button debounce & short/long press (`buttonTick`) | [buttons.md](buttons.md) | [buttons.puml](diagrams/buttons.puml) | done — 13 tests in [test/test_buttons/test_buttons.cpp](../test/test_buttons/test_buttons.cpp) |
| Display modes & Tamagotchi expressions (`stateToExpression`, `stateToFooter`, `sensorBarHeight`, `isNightHour`, `isEconomyTimedOut`) | [display.md](display.md) | [display.puml](diagrams/display.puml) | done — 32 tests in [test/test_display/test_display.cpp](../test/test_display/test_display.cpp) |
