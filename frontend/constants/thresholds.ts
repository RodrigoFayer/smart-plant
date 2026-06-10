export type SensorStatus = 'ok' | 'attention' | 'critical';

export const STATUS_COLORS: Record<SensorStatus, string> = {
  ok: '#4CAF50',
  attention: '#FFC107',
  critical: '#F44336',
};

interface ThresholdRange {
  ok: [number, number];
  attention: [number, number];
  unit: string;
}

export const THRESHOLDS: Record<'temp' | 'airHumidity' | 'soilMoisture' | 'lux' | 'ppm', ThresholdRange> = {
  temp: { ok: [18, 30], attention: [10, 35], unit: '°C' },
  airHumidity: { ok: [40, 70], attention: [30, 80], unit: '%' },
  soilMoisture: { ok: [40, 80], attention: [30, 90], unit: '%' },
  lux: { ok: [300, Infinity], attention: [100, Infinity], unit: 'lux' },
  ppm: { ok: [0, 400], attention: [0, 600], unit: 'ppm' },
};

export function calculateStatus(sensor: keyof typeof THRESHOLDS, value: number): SensorStatus {
  const t = THRESHOLDS[sensor];
  if (value >= t.ok[0] && value <= t.ok[1]) return 'ok';
  if (value >= t.attention[0] && value <= t.attention[1]) return 'attention';
  return 'critical';
}
