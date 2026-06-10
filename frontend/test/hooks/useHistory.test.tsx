import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useHistory } from '../../hooks/useHistory';
import * as api from '../../services/api';
import type { HistoryPeriod } from '../../services/api';

jest.mock('../../services/api', () => ({
  ...jest.requireActual('../../services/api'),
  fetchHistory: jest.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useHistory', () => {
  beforeEach(() => {
    (api.fetchHistory as jest.Mock).mockReset();
  });

  it('fetches history for the given sensor and period', async () => {
    const data = [{ sensor: 'soil', data: { moisture: 45 }, at: 1720000000 }];
    (api.fetchHistory as jest.Mock).mockResolvedValue(data);

    const { result } = await renderHook(() => useHistory('soil', '7d'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(api.fetchHistory).toHaveBeenCalledWith('soil', '7d');
    expect(result.current.data).toEqual(data);
  });

  it('defaults to the 24h period', async () => {
    (api.fetchHistory as jest.Mock).mockResolvedValue([]);

    await renderHook(() => useHistory('dht11'), { wrapper: createWrapper() });

    await waitFor(() => expect(api.fetchHistory).toHaveBeenCalledWith('dht11', '24h'));
  });

  it('exposes a loading state while the request is pending', async () => {
    let resolveFetch: (value: unknown[]) => void = () => {};
    (api.fetchHistory as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { result } = await renderHook(() => useHistory('soil'), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);

    await act(() => {
      resolveFetch([]);
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('refetches when the sensor or period changes', async () => {
    (api.fetchHistory as jest.Mock).mockResolvedValue([]);

    const { result, rerender } = await renderHook(
      ({ sensor, period }: { sensor: string; period: HistoryPeriod }) => useHistory(sensor, period),
      {
        wrapper: createWrapper(),
        initialProps: { sensor: 'soil', period: '24h' as const },
      }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchHistory).toHaveBeenCalledWith('soil', '24h');

    await rerender({ sensor: 'dht11', period: '7d' });

    await waitFor(() => expect(api.fetchHistory).toHaveBeenCalledWith('dht11', '7d'));
  });
});
