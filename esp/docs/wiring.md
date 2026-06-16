# Wiring & breadboard layout

Physical wiring reference for the ESP12 (NodeMCU Amica) + ADS1115 setup described in
[environment-and-pinout.md](environment-and-pinout.md) and [sensors.md](sensors.md).

Breadboard used: full-size, columns **1–30**, rows **A–J** (A–E above the center gutter,
F–J below), plus a power rail pair along the top edge and another along the bottom edge.

## 1. Final pin map (NodeMCU)

| NodeMCU pin | Function | Goes to | Jumper |
|---|---|---|---|
| 3V3 | Power | Breadboard `+` rail | M-M |
| GND | Power | Breadboard `-` rail | M-M |
| D1 (GPIO5) | I2C SCL | Shared bus: ADS1115 + OLED | M-M |
| D2 (GPIO4) | I2C SDA | Shared bus: ADS1115 + OLED | M-M |
| D3 (GPIO0) | DHT11 data | DHT11 module | M-F |
| D5 (GPIO14) | Rain sensor DO | Rain sensor module | M-F |
| D6 (GPIO12) | BTN1 signal | Button 1 module | M-F |
| D7 (GPIO13) | BTN2 signal | Button 2 module | M-F |
| A0, D0, D4, D8 | Free | — | — |

> A0, D0, D4 and D8 are free: MQ135 and the LDR moved to the ADS1115 (see below) and the
> buzzer is not used in this build.

## 2. ADS1115 (I2C ADC, shared I2C bus with the OLED)

| ADS1115 pin | Connects to | Jumper |
|---|---|---|
| VDD | `+` rail (3.3V) | M-M |
| GND | `-` rail | M-M |
| SCL | D1 row (shared with OLED SCL) | M-M |
| SDA | D2 row (shared with OLED SDA) | M-M |
| ADDR | `-` rail (GND → fixed I2C address `0x48`) | M-M |
| A0 | HL-69 (soil) AO | M-F |
| A1 | MQ135 AO | M-F |
| A2 | — (unused) | — |
| A3 | LDR divider midpoint | M-M (on-board) |

> Power the ADS1115 and MQ135/HL-69/LDR dividers all from the **3.3V rail**, not 5V/VIN.
> This keeps every analog signal within the ADS1115's safe input range (≤ VDD).
> MQ135's heater runs a bit cooler than its 5V datasheet spec, which is fine for
> relative ppm trends in a hobby setup.

## 3. Sensor-by-sensor wiring

| Component | Pin | Connects to | Jumper |
|---|---|---|---|
| OLED SSD1306 | VCC | `+` rail | M-F |
| | GND | `-` rail | M-F |
| | SCL | D1 / ADS1115 SCL row | M-F |
| | SDA | D2 / ADS1115 SDA row | M-F |
| DHT11 | VCC | `+` rail | M-F |
| | GND | `-` rail | M-F |
| | DATA | D3 | M-F |
| Rain sensor module | VCC | `+` rail | M-F |
| | GND | `-` rail | M-F |
| | DO | D5 | M-F |
| HL-69 (soil) | VCC | `+` rail | M-F |
| | GND | `-` rail | M-F |
| | AO | ADS1115 A0 | M-F |
| MQ135 | VCC | `+` rail | M-F |
| | GND | `-` rail | M-F |
| | AO | ADS1115 A1 | M-F |
| LDR + 1kΩ | LDR leg 1 | `+` rail | on-board, no jumper |
| | LDR leg 2 / R leg 1 (midpoint) | ADS1115 A3 | M-M |
| | R leg 2 | `-` rail | on-board, no jumper |
| BTN1 (wake/mode) | signal | D6 | M-F |
| | VCC / GND | rails | M-F |
| BTN2 (manual watering) | signal | D7 | M-F |
| | VCC / GND | rails | M-F |

**Jumper legend**
- **M-M** (male–male): both ends plug into breadboard holes — used for routing between
  rails, rows and on-board parts (NodeMCU, ADS1115, LDR dividers).
- **M-F** (male–female): male end into the breadboard, female end slides onto a module's
  pin header — used for every sensor module that sits off-board (near the pot, in open
  air, in the soil, etc.).

## 4. Breadboard layout

The breadboard hosts the ESP, the ADS1115 and the LDR voltage divider (everything
that benefits from being close to the I2C bus / ADC). Sensor modules that need to be
physically placed elsewhere (soil probe in the pot, DHT11 in open air, rain sensor
exposed, OLED on the enclosure face, buttons on the case) connect back via M-F
jumpers to the rails and signal rows described above.

| Columns | Rows | Occupant |
|---|---|---|
| 1–15 | A and J (straddles the gutter) | NodeMCU ESP12 (Amica) |
| 16 | — | gap |
| 17–26 | F (single in-line header) | ADS1115 module |
| 27–28 | A–E | LDR + 1kΩ resistor — divider (→ A3) |
| top rail | `+` / `-` | 3.3V / GND, fed from NodeMCU 3V3 / GND |
| bottom rail | `+` / `-` | mirrored 3.3V / GND, jumpered from top rail |

### Breadboard matrix

```
        1-5    6-10   11-15  16   17-21  22-26  27-28
 (+) ─────────────────────────────────────────────────  3.3V rail
 (-) ─────────────────────────────────────────────────  GND rail
  A  [ NodeMCU pin row 1            ][ ADS────────][LDR ]
  B  [                              ][   1115     ][ +  ]
  C  [        ESP12 / NodeMCU       ][  module    ][1kΩ ]
  D  [          (seated)            ][  (10-pin   ][div ]
  E  [                              ][  in-line)  ][    ]
  ── gutter ──────────────────────────────────────────────────
  F  [                              ][ADS1115 pins]
  G  [                              ]
  H  [        ESP12 / NodeMCU       ]
  I  [        (seated)              ]
  J  [ NodeMCU pin row 2            ]
 (+) ───────────────────────────────────────────────────────  3.3V rail
 (-) ───────────────────────────────────────────────────────  GND rail
```

Off-board modules (OLED, DHT11, rain, HL-69, MQ135, BTN1, BTN2) are not shown on
the grid — they hang off the rails and signal rows via M-F jumpers per the tables above.

### ESP12 / NodeMCU pin diagram

```
              ┌───────────────────────┐
        A0 ───┤ 1                   30 ├─── D0  (free)
       GND ───┤ 2                   29 ├─── D1  (I2C SCL)
       VIN ───┤ 3                   28 ├─── D2  (I2C SDA)
        D3 ───┤ 4   (DHT11 data)    27 ├─── GND
        D4 ───┤ 5   (free)         26 ├─── 3V3
       3V3 ───┤ 6                   25 ├─── D5  (rain DO)
       GND ───┤ 7                   24 ├─── D6  (BTN1)
        RX ───┤ 8                   23 ├─── D7  (BTN2)
        TX ───┤ 9                   22 ├─── D8  (free)
       GND ───┤ 10                  21 ├─── 3V3
              └───────────[ USB ]──────┘
```

> Pin order/silkscreen can vary slightly between NodeMCU Amica revisions — confirm
> against the label printed on your specific board before wiring.

## 5. Summary of changes vs. the previous pinout

- MQ135 moves from digital threshold (D0, DO) → analog ppm via ADS1115 A1.
- A single LDR moves from a digital threshold → analog lux via ADS1115 A3 (A2 unused).
- The buzzer (D4) is not installed in this build.
- HL-69 moves from the ESP's native A0 → ADS1115 A0 (16-bit instead of 10-bit).
- A0, D0 and D8 on the ESP are now free for future use.
