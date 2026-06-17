import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import { Stack } from 'expo-router';
import type { ReactNode } from 'react';

import { useSocket } from '../../hooks/useSocket';
import { requestNotificationPermissions } from '../../services/notifications';
import { useSettingsStore } from '../../store/settingsStore';

jest.mock('../../hooks/useSocket', () => ({
  useSocket: jest.fn(() => ({ connected: true })),
}));

jest.mock('../../services/notifications', () => ({
  requestNotificationPermissions: jest.fn(),
}));

jest.mock('../../store/settingsStore', () => ({
  useSettingsStore: { getState: jest.fn(() => ({ hydrate: jest.fn() })) },
}));

jest.mock('expo-router', () => {
  const { View } = require('react-native');
  const ScreenMock = jest.fn(() => null);
  const StackMock = Object.assign(
    jest.fn(({ children }: { children?: ReactNode }) => <View testID="stack">{children}</View>),
    { Screen: ScreenMock }
  );
  return {
    Stack: StackMock,
    ThemeProvider: jest.fn(({ children }: { children?: ReactNode }) => <View testID="theme-provider">{children}</View>),
    DefaultTheme: { dark: false },
    DarkTheme: { dark: true },
  };
});

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    QueryClientProvider: jest.fn(({ children }: { children?: ReactNode }) => children),
  };
});

// The real SafeAreaProvider renders nothing until it measures insets, which never
// happens in the test renderer — so its children (the whole tree under test) would
// never mount. Mock it to render children synchronously.
jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
    SafeAreaView: ({ children }: { children?: ReactNode }) => <View>{children}</View>,
  };
});

import RootLayout from '../../app/_layout';

describe('RootLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('connects the live socket on mount', async () => {
    await render(<RootLayout />);

    expect(useSocket).toHaveBeenCalled();
  });

  it('wraps the app in a QueryClientProvider', async () => {
    await render(<RootLayout />);

    const [props] = (QueryClientProvider as jest.Mock).mock.calls[0];
    expect(props.client).toBeInstanceOf(QueryClient);
  });

  it('registers the index, history, and settings screens', async () => {
    await render(<RootLayout />);

    const names = (Stack.Screen as unknown as jest.Mock).mock.calls.map(([props]: [{ name: string }]) => props.name);
    expect(names).toEqual(['index', 'history', 'settings']);
  });

  it('hydrates persisted settings on mount', async () => {
    const hydrate = jest.fn();
    (useSettingsStore.getState as jest.Mock).mockReturnValue({ hydrate });

    await render(<RootLayout />);

    expect(hydrate).toHaveBeenCalled();
  });

  it('requests notification permissions on mount', async () => {
    await render(<RootLayout />);

    expect(requestNotificationPermissions).toHaveBeenCalled();
  });
});
