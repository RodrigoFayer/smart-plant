import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_BACKEND_URL } from '../../constants/env';
import {
  LANGUAGE_STORAGE_KEY,
  NOTIFICATIONS_ENABLED_STORAGE_KEY,
  useSettingsStore,
} from '../../store/settingsStore';

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettingsStore.setState({ backendUrl: DEFAULT_BACKEND_URL, notificationsEnabled: true, language: 'en' });
  });

  it('exposes the backend URL from the environment', () => {
    expect(useSettingsStore.getState().backendUrl).toBe(DEFAULT_BACKEND_URL);
  });

  it('starts with critical alert notifications enabled', () => {
    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });

  it('persists the notifications preference', async () => {
    await useSettingsStore.getState().setNotificationsEnabled(false);

    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
    expect(await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_STORAGE_KEY)).toBe('false');
  });

  it('hydrates the notifications preference from storage', async () => {
    await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_STORAGE_KEY, 'false');

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().notificationsEnabled).toBe(false);
  });

  it('defaults the language to English when the device locale is English', () => {
    expect(useSettingsStore.getState().language).toBe('en');
  });

  it('persists the selected language', async () => {
    await useSettingsStore.getState().setLanguage('pt-BR');

    expect(useSettingsStore.getState().language).toBe('pt-BR');
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt-BR');
  });

  it('hydrates the language from storage', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'pt-BR');

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().language).toBe('pt-BR');
  });

  it('keeps the current language when there is nothing stored to hydrate', async () => {
    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().language).toBe('en');
  });
});
