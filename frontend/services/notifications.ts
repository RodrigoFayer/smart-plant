import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<void> {
  await Notifications.requestPermissionsAsync();
}

export async function notifyCriticalAlert(alert: { type: string; message: string }): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Smart Plant alert', body: alert.message },
    trigger: null,
  });
}
