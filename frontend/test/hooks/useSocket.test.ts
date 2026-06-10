import { act, renderHook } from '@testing-library/react-native';

import { BACKEND_URL } from '../../services/api';
import { usePlantStore } from '../../store/plantStore';
import { useSettingsStore } from '../../store/settingsStore';

type Handler = (...args: any[]) => void;

const handlers: Record<string, Handler> = {};
const mockSocket = {
  on: jest.fn((event: string, handler: Handler) => {
    handlers[event] = handler;
  }),
  disconnect: jest.fn(),
};
const mockIo = jest.fn((..._args: unknown[]) => mockSocket);

jest.mock('socket.io-client', () => ({
  io: (...args: unknown[]) => mockIo(...args),
}));

jest.mock('../../services/notifications', () => ({
  notifyCriticalAlert: jest.fn(),
}));

// Imported after the mocks so useSocket picks up the mocked socket.io-client and notifications service.
import { useSocket } from '../../hooks/useSocket';
import { notifyCriticalAlert } from '../../services/notifications';

describe('useSocket', () => {
  const { set: _set, ...initialState } = usePlantStore.getState();

  beforeEach(() => {
    usePlantStore.setState(initialState);
    useSettingsStore.setState({ backendUrl: BACKEND_URL, notificationsEnabled: true });
    mockIo.mockClear();
    mockSocket.on.mockClear();
    mockSocket.disconnect.mockClear();
    (notifyCriticalAlert as jest.Mock).mockClear();
    for (const key of Object.keys(handlers)) delete handlers[key];
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('connects to the backend URL', async () => {
    await renderHook(() => useSocket());

    expect(mockIo).toHaveBeenCalledWith(BACKEND_URL);
  });

  it('starts disconnected and flips to connected on the connect event', async () => {
    const { result } = await renderHook(() => useSocket());

    expect(result.current.connected).toBe(false);

    await act(() => {
      handlers['connect']();
    });

    expect(result.current.connected).toBe(true);
  });

  it('flips back to disconnected on the disconnect event', async () => {
    const { result } = await renderHook(() => useSocket());

    await act(() => handlers['connect']());
    await act(() => handlers['disconnect']());

    expect(result.current.connected).toBe(false);
  });

  it('stores sensor:update readings under their sensor key', async () => {
    await renderHook(() => useSocket());

    await act(() => {
      handlers['sensor:update']({ sensor: 'dht11', data: { temp: 24, humidity: 62, at: 1720000000 } });
    });

    expect(usePlantStore.getState().dht11).toEqual({ temp: 24, humidity: 62, at: 1720000000 });
  });

  it('stores plant:state updates', async () => {
    await renderHook(() => useSocket());

    await act(() => {
      handlers['plant:state']({ state: 'happy', reason: null, color: 'green' });
    });

    expect(usePlantStore.getState().plant).toEqual({ state: 'happy', reason: null, color: 'green' });
  });

  it('stores watering:logged events as lastWatering', async () => {
    await renderHook(() => useSocket());

    await act(() => {
      handlers['watering:logged']({ origin: 'manual_btn', at: 1719900000 });
    });

    expect(usePlantStore.getState().lastWatering).toEqual({ origin: 'manual_btn', at: 1719900000 });
  });

  it('prepends plant:alert events with a received timestamp', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1720000000000);
    await renderHook(() => useSocket());

    await act(() => {
      handlers['plant:alert']({ type: 'critical', message: 'Soil too dry!' });
    });

    expect(usePlantStore.getState().alerts).toEqual([
      { type: 'critical', message: 'Soil too dry!', at: 1720000000000 },
    ]);
  });

  it('keeps only the 10 most recent alerts', async () => {
    const existing = Array.from({ length: 10 }, (_, i) => ({ type: 'critical', message: `old ${i}`, at: i }));
    usePlantStore.setState({ alerts: existing });
    jest.spyOn(Date, 'now').mockReturnValue(999);

    await renderHook(() => useSocket());

    await act(() => {
      handlers['plant:alert']({ type: 'critical', message: 'new alert' });
    });

    const alerts = usePlantStore.getState().alerts;
    expect(alerts).toHaveLength(10);
    expect(alerts[0]).toEqual({ type: 'critical', message: 'new alert', at: 999 });
    expect(alerts[9]).toEqual(existing[8]);
  });

  it('triggers a local notification for critical alerts when notifications are enabled', async () => {
    useSettingsStore.setState({ notificationsEnabled: true });
    await renderHook(() => useSocket());

    await act(() => {
      handlers['plant:alert']({ type: 'critical', message: 'Soil too dry!' });
    });

    expect(notifyCriticalAlert).toHaveBeenCalledWith({ type: 'critical', message: 'Soil too dry!' });
  });

  it('does not trigger a notification for critical alerts when notifications are disabled', async () => {
    useSettingsStore.setState({ notificationsEnabled: false });
    await renderHook(() => useSocket());

    await act(() => {
      handlers['plant:alert']({ type: 'critical', message: 'Soil too dry!' });
    });

    expect(notifyCriticalAlert).not.toHaveBeenCalled();
  });

  it('does not trigger a notification for non-critical alerts', async () => {
    useSettingsStore.setState({ notificationsEnabled: true });
    await renderHook(() => useSocket());

    await act(() => {
      handlers['plant:alert']({ type: 'warning', message: 'Soil getting dry' });
    });

    expect(notifyCriticalAlert).not.toHaveBeenCalled();
  });

  it('disconnects the socket on unmount', async () => {
    const { unmount } = await renderHook(() => useSocket());

    await unmount();

    expect(mockSocket.disconnect).toHaveBeenCalled();
  });

  it('reconnects to the new backend URL when it changes', async () => {
    await renderHook(() => useSocket());

    expect(mockIo).toHaveBeenLastCalledWith(BACKEND_URL);

    await act(async () => {
      await useSettingsStore.getState().setBackendUrl('http://10.0.0.5:3000');
    });

    expect(mockSocket.disconnect).toHaveBeenCalled();
    expect(mockIo).toHaveBeenLastCalledWith('http://10.0.0.5:3000');
  });
});
