import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { DEFAULT_BACKEND_URL } from '../constants/env';
import { defaultLanguage, type Language } from '../constants/i18n';

export const NOTIFICATIONS_ENABLED_STORAGE_KEY = 'settings:notificationsEnabled';
export const LANGUAGE_STORAGE_KEY = 'settings:language';

export interface SettingsStore {
  // Backend address is configured at build time via EXPO_PUBLIC_BACKEND_URL (.env).
  backendUrl: string;
  notificationsEnabled: boolean;
  language: Language;
  hydrate: () => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  backendUrl: DEFAULT_BACKEND_URL,
  notificationsEnabled: true,
  language: defaultLanguage(),
  hydrate: async () => {
    const [storedNotificationsEnabled, storedLanguage] = await Promise.all([
      AsyncStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY),
      AsyncStorage.getItem(LANGUAGE_STORAGE_KEY),
    ]);
    set((state) => ({
      notificationsEnabled:
        storedNotificationsEnabled !== null ? storedNotificationsEnabled === 'true' : state.notificationsEnabled,
      language: (storedLanguage as Language) ?? state.language,
    }));
  },
  setNotificationsEnabled: async (enabled) => {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, String(enabled));
    set({ notificationsEnabled: enabled });
  },
  setLanguage: async (language) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    set({ language });
  },
}));
