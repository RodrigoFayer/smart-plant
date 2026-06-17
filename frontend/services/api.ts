import { DEFAULT_BACKEND_URL } from '../constants/env';
import { PlantState } from '../store/plantStore';
import { useSettingsStore } from '../store/settingsStore';

export const BACKEND_URL = DEFAULT_BACKEND_URL;

export type HistoryPeriod = '1h' | '24h' | '7d' | '30d';

export interface StatusResponse {
  plant: { state: PlantState; reason: string | null } | null;
  sensors: Partial<{
    dht11: { temp: number; humidity: number; at: number };
    soil: { moisture: number; at: number };
    ldr: { lux: number; at: number };
    mq135: { ppm: number; at: number };
    rain: { detected: boolean; at: number };
  }>;
  lastWatering: { origin: string; at: number } | null;
}

export interface HistoryReading {
  sensor: string;
  data: Record<string, number | boolean>;
  at: number;
}

export async function fetchStatus(): Promise<StatusResponse> {
  const backendUrl = useSettingsStore.getState().backendUrl;
  const res = await fetch(`${backendUrl}/status`);
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`);
  return res.json();
}

export async function fetchHistory(sensor: string, period: HistoryPeriod = '24h'): Promise<HistoryReading[]> {
  const backendUrl = useSettingsStore.getState().backendUrl;
  const res = await fetch(`${backendUrl}/history?sensor=${encodeURIComponent(sensor)}&period=${period}`);
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`);
  return res.json();
}

export async function logWatering(): Promise<void> {
  const backendUrl = useSettingsStore.getState().backendUrl;
  const res = await fetch(`${backendUrl}/watering`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to log watering: ${res.status}`);
}
