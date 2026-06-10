import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { DEFAULT_BACKEND_URL } from '../constants/env';

export const BACKEND_URL_STORAGE_KEY = 'settings:backendUrl';
export const NOTIFICATIONS_ENABLED_STORAGE_KEY = 'settings:notificationsEnabled';

export interface SettingsStore {
  backendUrl: string;
  notificationsEnabled: boolean;
  hydrate: () => Promise<void>;
  setBackendUrl: (url: string) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  backendUrl: DEFAULT_BACKEND_URL,
  notificationsEnabled: true,
  hydrate: async () => {
    const [storedBackendUrl, storedNotificationsEnabled] = await Promise.all([
      AsyncStorage.getItem(BACKEND_URL_STORAGE_KEY),
      AsyncStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY),
    ]);
    set((state) => ({
      backendUrl: storedBackendUrl ?? state.backendUrl,
      notificationsEnabled:
        storedNotificationsEnabled !== null ? storedNotificationsEnabled === 'true' : state.notificationsEnabled,
    }));
  },
  setBackendUrl: async (url) => {
    const trimmed = url.trim();
    if (trimmed) {
      await AsyncStorage.setItem(BACKEND_URL_STORAGE_KEY, trimmed);
    } else {
      await AsyncStorage.removeItem(BACKEND_URL_STORAGE_KEY);
    }
    set({ backendUrl: trimmed || DEFAULT_BACKEND_URL });
  },
  setNotificationsEnabled: async (enabled) => {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, String(enabled));
    set({ notificationsEnabled: enabled });
  },
}));
