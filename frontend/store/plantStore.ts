import { create } from 'zustand';

export type PlantState = 'happy' | 'thirsty' | 'hot' | 'noLight' | 'sick' | 'sleeping';

export interface Alert {
  type: string;
  message: string;
  at: number;
}

export interface SensorsState {
  dht11: { temp: number; humidity: number; at: number } | null;
  soil: { moisture: number; at: number } | null;
  ldr: { lux: number; at: number } | null;
  mq135: { ppm: number; at: number } | null;
  rain: { detected: boolean; at: number } | null;
  plant: { state: PlantState; reason: string | null; color: string } | null;
  lastWatering: { origin: string; at: number } | null;
  alerts: Alert[];
}

export interface PlantStore extends SensorsState {
  set: (updater: (state: SensorsState) => Partial<SensorsState>) => void;
}

const initialState: SensorsState = {
  dht11: null,
  soil: null,
  ldr: null,
  mq135: null,
  rain: null,
  plant: null,
  lastWatering: null,
  alerts: [],
};

export const usePlantStore = create<PlantStore>((set) => ({
  ...initialState,
  set: (updater) => set(updater),
}));
