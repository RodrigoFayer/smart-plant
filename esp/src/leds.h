#ifndef LEDS_H
#define LEDS_H

// LED color enum — used by both RGB LEDs and the soil bar.
typedef enum {
    LED_OFF = 0,
    LED_RED,
    LED_GREEN,
    LED_YELLOW,
    LED_BLUE,
    LED_PURPLE,
} LedColor;

// RGB LED 1 — maps the plant state string to a status color.
// Returns LED_OFF for any unrecognised state.
LedColor rgbStatusColor(const char* state);

// RGB LED 2 — returns the most urgent active alert color, or LED_OFF.
// Priority: temp (red) > ppm (purple) > soil (yellow) > rain (blue).
LedColor rgbAlertColor(bool rain, int temp, int soilMoisture, int ppm);

// 5-LED soil bar — number of LEDs to light (0–5) for a given moisture %.
int soilBarSegments(int moisture);

// 5-LED soil bar — color of the active LEDs for a given moisture %.
LedColor soilBarColor(int moisture);

#endif
