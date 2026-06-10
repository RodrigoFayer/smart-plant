# Outputs — OLED & Tamagotchi

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
