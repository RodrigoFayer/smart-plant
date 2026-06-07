# Outputs — LEDs, OLED & Tamagotchi

## RGB LED 1 — General status
| Color | Meaning |
|---|---|
| Green | All parameters normal |
| Yellow | 1 parameter in attention range |
| Red | 1 or more parameters critical |

## RGB LED 2 — Specific alerts
| Color | Trigger |
|---|---|
| Blue | Rain detected |
| Red | Critical temperature (> 38°C) |
| Yellow | Dry soil (< 20%) |
| Purple | Polluted air (> 700 ppm) |
| Off | No active alerts |

## 5-LED bar — Soil moisture
- 0% → all off
- 1–20% → 1 red LED
- 21–40% → 2 yellow LEDs
- 41–60% → 3 yellow LEDs
- 61–80% → 4 green LEDs
- 81–100% → 5 green LEDs

## OLED display — modes

### Normal mode
- Left side: animated Tamagotchi character (plant state)
- Right side: soil moisture, temperature, and light bars (3 vertical bars)
- Footer: status message ("I'm doing great!" / "I need water...")

### Night mode
- Brightness reduced to minimum
- Shows only the current time (NTPClient)
- Character sleeping, no animations

### Economy mode
- Display turns off after 30s with no events
- Wakes on any button press or new alert

## Tamagotchi — states and OLED expressions

| State | Expression | Animation |
|---|---|---|
| Happy | Smile, rosy cheeks | Blinking + droplets around |
| Thirsty | Sad, sweating | Drop falling |
| Hot | Tired, tongue out | Heat waves rising |
| No light | Drowsy | Blinking ZZZ |
| Sick | Green face | Blinking ! |
| Sleeping | Eyes closed | Soft ZZZ |
