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
    console.log('[useSocket] connecting to', backendUrl);
    const socket = io(backendUrl);

    socket.on('connect', () => {
      console.log('[useSocket] connected', socket.id);
      setConnected(true);
    });
    socket.on('disconnect', (reason) => {
      console.log('[useSocket] disconnected', reason);
      setConnected(false);
    });
    socket.on('connect_error', (err) => {
      console.log('[useSocket] connect_error', err.message);
    });

    socket.on('sensor:update', ({ sensor, data, at }) => {
      console.log('[useSocket] sensor:update', sensor, data);
      set((state) => ({ ...state, [sensor]: { ...data, at } }));
    });

    socket.on('plant:state', (state) => {
      console.log('[useSocket] plant:state', state);
      set((s) => ({ ...s, plant: state }));
    });

    socket.on('plant:alert', (alert) => {
      console.log('[useSocket] plant:alert', alert);
      set((state) => ({
        ...state,
        alerts: [{ ...alert, at: Date.now() }, ...state.alerts].slice(0, 10),
      }));

      if (alert.type === 'critical' && useSettingsStore.getState().notificationsEnabled) {
        notifyCriticalAlert(alert);
      }
    });

    socket.on('watering:logged', (watering) => {
      console.log('[useSocket] watering:logged', watering);
      set((state) => ({ ...state, lastWatering: watering }));
    });

    return () => {
      socket.disconnect();
    };
  }, [set, backendUrl]);

  return { connected };
}
