jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

import * as Notifications from 'expo-notifications';

import { notifyCriticalAlert, requestNotificationPermissions } from '../../services/notifications';

describe('notifications service', () => {
  afterEach(() => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockClear();
    (Notifications.scheduleNotificationAsync as jest.Mock).mockClear();
  });

  it('configures the notification handler to show alerts while the app is foregrounded', () => {
    expect(Notifications.setNotificationHandler).toHaveBeenCalledWith(
      expect.objectContaining({ handleNotification: expect.any(Function) })
    );
  });

  it('requests notification permissions', async () => {
    await requestNotificationPermissions();

    expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
  });

  it('schedules a local notification for a critical alert', async () => {
    await notifyCriticalAlert({ type: 'critical', message: 'Soil too dry!' });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: { title: 'Smart Plant alert', body: 'Soil too dry!' },
      trigger: null,
    });
  });
});
