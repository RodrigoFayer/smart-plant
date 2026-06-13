# OTA (wireless firmware update)

`main.cpp` includes `ArduinoOTA` (bundled with the ESP8266 Arduino core — no extra `lib_deps`). Hostname/password come from `config.h` (`OTA_HOSTNAME` / `OTA_PASSWORD`).

## First flash — must be via USB

OTA only works once a build that includes `ArduinoOTA` is already running on the device. The very first flash (or any flash after `config.h` is missing/out of sync) needs a cable.

If the Mac has no USB hub available, do this first flash on a Windows PC:

1. Install **VS Code** + the **PlatformIO IDE** extension (downloads the ESP8266 toolchain automatically — no WSL needed).
2. Open the `esp/` folder from this repo.
3. Make sure `src/config.h` exists with real Wi-Fi/MQTT/OTA credentials (copy from `config.example.h` if missing — it's gitignored).
4. Connect the ESP via USB and run **PlatformIO: Upload** (or `pio run -t upload`).

## Subsequent updates — OTA from the Mac

Once the OTA-enabled build is on the device and it's connected to Wi-Fi:

```bash
pio run -t upload --upload-port smart-plant.local --upload-flags="--auth=<OTA_PASSWORD>"
```

- `smart-plant.local` is the mDNS hostname (`OTA_HOSTNAME` in `config.h`). If mDNS resolution fails, use the device's IP instead (shown on the OLED at boot, or check the router/MQTT broker logs).
- `<OTA_PASSWORD>` must match `OTA_PASSWORD` in `config.h`.
- During the update, the OLED shows "OTA update..." and the watchdog is disabled until the device reboots.
