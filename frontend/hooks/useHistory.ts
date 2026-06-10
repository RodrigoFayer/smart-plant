import { useQuery } from '@tanstack/react-query';

import { fetchHistory, HistoryPeriod, HistoryReading } from '../services/api';

export function useHistory(sensor: string, period: HistoryPeriod = '24h') {
  return useQuery<HistoryReading[]>({
    queryKey: ['history', sensor, period],
    queryFn: () => fetchHistory(sensor, period),
  });
}
