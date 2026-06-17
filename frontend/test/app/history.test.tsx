import { fireEvent, render } from '@testing-library/react-native';

import { useHistory } from '../../hooks/useHistory';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

jest.mock('../../hooks/useHistory', () => ({
  useHistory: jest.fn(),
}));

jest.mock('../../components/SensorChart', () => ({
  SensorChart: (props: Record<string, unknown>) => {
    const { Text } = require('react-native');
    return <Text testID="sensor-chart">{JSON.stringify(props)}</Text>;
  },
}));

import HistoryScreen, { METRICS, PERIODS } from '../../app/history';

function chartProps(getByTestId: (id: string) => any) {
  return JSON.parse(getByTestId('sensor-chart').props.children);
}

describe('HistoryScreen', () => {
  beforeEach(() => {
    (useHistory as jest.Mock).mockReturnValue({ data: [], isLoading: false });
  });

  it('defaults to the first metric and the 1h period', async () => {
    const { getByTestId } = await render(<HistoryScreen />);

    expect(useHistory).toHaveBeenCalledWith(METRICS[0].sensor, '1h');
    expect(chartProps(getByTestId)).toEqual(
      expect.objectContaining({ dataKey: METRICS[0].dataKey, isLoading: false })
    );
  });

  it('renders a picker option for every metric and every period', async () => {
    const { getByTestId } = await render(<HistoryScreen />);

    for (const metric of METRICS) {
      expect(getByTestId(`metric-option-${metric.key}`)).toBeTruthy();
    }
    for (const period of PERIODS) {
      expect(getByTestId(`period-option-${period}`)).toBeTruthy();
    }
  });

  it('switches the requested sensor when a metric is selected', async () => {
    const soilMoisture = METRICS.find((m) => m.key === 'soilMoisture')!;

    const { getByTestId } = await render(<HistoryScreen />);
    await fireEvent.press(getByTestId(`metric-option-${soilMoisture.key}`));

    expect(useHistory).toHaveBeenLastCalledWith(soilMoisture.sensor, '1h');
    expect(chartProps(getByTestId)).toEqual(expect.objectContaining({ dataKey: soilMoisture.dataKey }));
  });

  it('switches the requested period when a period is selected', async () => {
    const { getByTestId } = await render(<HistoryScreen />);
    await fireEvent.press(getByTestId('period-option-7d'));

    expect(useHistory).toHaveBeenLastCalledWith(METRICS[0].sensor, '7d');
  });

  it('passes the loading state from useHistory to the chart', async () => {
    (useHistory as jest.Mock).mockReturnValue({ data: undefined, isLoading: true });

    const { getByTestId } = await render(<HistoryScreen />);

    expect(chartProps(getByTestId)).toEqual(expect.objectContaining({ isLoading: true, data: [] }));
  });

  it('passes threshold lines for metrics that define them', async () => {
    const { getByTestId } = await render(<HistoryScreen />);

    expect(chartProps(getByTestId)).toEqual(
      expect.objectContaining({ thresholdLines: { ok: [18, 30], attention: [10, 35] } })
    );
  });

});
