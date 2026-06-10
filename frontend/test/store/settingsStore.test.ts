import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_BACKEND_URL } from '../../constants/env';
import {
  BACKEND_URL_STORAGE_KEY,
  NOTIFICATIONS_ENABLED_STORAGE_KEY,
  useSettingsStore,
} from '../../store/settingsStore';

describe('settingsStore', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    useSettingsStore.setState({ backendUrl: DEFAULT_BACKEND_URL, notificationsEnabled: true });
  });

  it('starts with the default backend URL', () => {
    expect(useSettingsStore.getState().backendUrl).toBe(DEFAULT_BACKEND_URL);
  });

  it('persists a custom backend URL and updates the state', async () => {
    await useSettingsStore.getState().setBackendUrl('http://10.0.0.5:3000');

    expect(useSettingsStore.getState().backendUrl).toBe('http://10.0.0.5:3000');
    expect(await AsyncStorage.getItem(BACKEND_URL_STORAGE_KEY)).toBe('http://10.0.0.5:3000');
  });

  it('trims whitespace before storing a custom backend URL', async () => {
    await useSettingsStore.getState().setBackendUrl('  http://10.0.0.5:3000  ');

    expect(useSettingsStore.getState().backendUrl).toBe('http://10.0.0.5:3000');
  });

  it('resets to the default and clears storage when set to a blank value', async () => {
    await useSettingsStore.getState().setBackendUrl('http://10.0.0.5:3000');

    await useSettingsStore.getState().setBackendUrl('   ');

    expect(useSettingsStore.getState().backendUrl).toBe(DEFAULT_BACKEND_URL);
    expect(await AsyncStorage.getItem(BACKEND_URL_STORAGE_KEY)).toBeNull();
  });

  it('hydrates the backend URL from storage when present', async () => {
    await AsyncStorage.setItem(BACKEND_URL_STORAGE_KEY, 'http://10.0.0.9:3000');

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().backendUrl).toBe('http://10.0.0.9:3000');
  });

  it('keeps the default backend URL when there is nothing stored to hydrate', async () => {
    await useSettingsStore.getState().hydrate();

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

  it('keeps the default notifications preference when there is nothing stored to hydrate', async () => {
    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().notificationsEnabled).toBe(true);
  });
});
