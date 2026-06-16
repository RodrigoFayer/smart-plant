# Screens & components

## Main screen (index.tsx)

Vertical scroll layout:

1. **Header**: plant name + connection indicator (green/red dot)
2. **Tamagotchi**: animated character centered, state below ("I'm doing great! 🌱")
3. **Sensor cards**: 2-column grid
   - Temperature + air humidity (DHT11)
   - Soil moisture (visual bar)
   - Light level (sun icon with intensity)
   - Air quality (ppm with colored badge)
   - Rain (icon with status)
4. **Last watering**: "2 days ago — manual" with a "Log watering now" button
5. **Recent alerts**: list of recent alerts with timestamps

## Tamagotchi.tsx component

Uses `react-native-svg` to draw the character. Receives `state: PlantState` and animates with `react-native-reanimated`:

- Eye-blink animation every 3–5s (random)
- Smooth idle sway (loop, using `useSharedValue` + `withRepeat`)
- State-specific particles (drops, heat, ZZZ) with `withTiming`
- Facial expression changes based on the received state

## SensorCard.tsx — props

```typescript
interface SensorCardProps {
  title: string
  value: string | number
  unit: string
  status: 'ok' | 'attention' | 'critical'
  icon: string  // Ionicons icon name
  updatedAt: number  // epoch
}
```

The status badge uses semantic colors: green for ok, yellow for attention, red for critical. The color is calculated in `constants/thresholds.ts` based on the received value.

## History screen (history.tsx)

- Sensor picker + period picker (1h / 24h / 7d / 30d)
- Line chart (Victory Native) with the period's data
- Horizontal reference line at the ok/attention limits
- Loading skeleton while fetching
