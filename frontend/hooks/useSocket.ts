import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

import { notifyCriticalAlert } from '../services/notifications';
import { usePlantStore } from '../store/plantStore';
import { useSettingsStore } from '../store/settingsStore';

export function useSocket() {
  const set = usePlantStore((s) => s.set);
  const backendUrl = useSettingsStore((s) => s.backendUrl);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(backendUrl);

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('sensor:update', ({ sensor, data }) => {
      set((state) => ({ ...state, [sensor]: data }));
    });

    socket.on('plant:state', (state) => {
      set((s) => ({ ...s, plant: state }));
    });

    socket.on('plant:alert', (alert) => {
      set((state) => ({
        ...state,
        alerts: [{ ...alert, at: Date.now() }, ...state.alerts].slice(0, 10),
      }));

      if (alert.type === 'critical' && useSettingsStore.getState().notificationsEnabled) {
        notifyCriticalAlert(alert);
      }
    });

    socket.on('watering:logged', (watering) => {
      set((state) => ({ ...state, lastWatering: watering }));
    });

    return () => {
      socket.disconnect();
    };
  }, [set, backendUrl]);

  return { connected };
}
