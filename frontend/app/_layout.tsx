import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useSocket } from '../hooks/useSocket';
import { requestNotificationPermissions } from '../services/notifications';
import { useSettingsStore } from '../store/settingsStore';

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useSocket();

  useEffect(() => {
    useSettingsStore.getState().hydrate();
    requestNotificationPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="history" options={{ title: 'History' }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          </Stack>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
