#pragma once
#include <stdint.h>
#include <string.h>
#include <stdlib.h>

// Minimal Arduino type aliases used by pure-logic headers
typedef uint8_t  byte;
typedef bool     boolean;

// Pure math macros from Arduino — safe to replicate here
#define constrain(x, lo, hi) ((x) < (lo) ? (lo) : ((x) > (hi) ? (hi) : (x)))
#define map(x, fl, tl, fh, th) \
    ((long)(x - fl) * (th - fh) / (tl - fl) + fh)

// millis() — overridable in tests via a global variable
extern unsigned long _mock_millis;
inline unsigned long millis() { return _mock_millis; }
