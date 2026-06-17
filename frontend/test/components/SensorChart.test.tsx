import { render } from '@testing-library/react-native';

import { buildChartData, SensorChart } from '../../components/SensorChart';
import type { HistoryReading } from '../../services/api';

jest.mock('@shopify/react-native-skia', () => ({ matchFont: () => null }));

jest.mock('victory-native', () => ({
  CartesianChart: ({ children, ...rest }: any) => {
    const { View } = require('react-native');
    return <View testID="sensor-chart-cartesian" {...rest} />;
  },
  Line: () => null,
  Area: () => null,
  Scatter: () => null,
}));

describe('buildChartData', () => {
  it('maps history readings to x/y points using the given data key', () => {
    const data: HistoryReading[] = [
      { sensor: 'soil', data: { moisture: 45 }, at: 1000 },
      { sensor: 'soil', data: { moisture: 50 }, at: 2000 },
    ];

    expect(buildChartData(data, 'moisture')).toEqual([
      { x: 1000, y: 45 },
      { x: 2000, y: 50 },
    ]);
  });

  it('skips readings where the data key is not a number', () => {
    const data: HistoryReading[] = [
      { sensor: 'rain', data: { detected: true }, at: 1000 },
      { sensor: 'rain', data: { detected: false, level: 12 }, at: 2000 },
    ];

    expect(buildChartData(data, 'level')).toEqual([{ x: 2000, y: 12 }]);
  });

  it('adds the ok/attention threshold bounds to every point when given', () => {
    const data: HistoryReading[] = [
      { sensor: 'dht11', data: { temp: 24 }, at: 1000 },
      { sensor: 'dht11', data: { temp: 26 }, at: 2000 },
    ];

    expect(buildChartData(data, 'temp', { ok: [18, 30], attention: [10, 35] })).toEqual([
      { x: 1000, y: 24, okMin: 18, okMax: 30, attentionMin: 10, attentionMax: 35 },
      { x: 2000, y: 26, okMin: 18, okMax: 30, attentionMin: 10, attentionMax: 35 },
    ]);
  });

  it('omits non-finite threshold bounds', () => {
    const data: HistoryReading[] = [{ sensor: 'mq135', data: { ppm: 320 }, at: 1000 }];

    expect(buildChartData(data, 'ppm', { ok: [0, Infinity], attention: [0, Infinity] })).toEqual([
      { x: 1000, y: 320, okMin: 0, attentionMin: 0 },
    ]);
  });
});

describe('SensorChart', () => {
  const data: HistoryReading[] = [
    { sensor: 'soil', data: { moisture: 45 }, at: 1000 },
    { sensor: 'soil', data: { moisture: 50 }, at: 2000 },
  ];

  it('shows a loading skeleton while fetching', async () => {
    const { getByTestId, queryByTestId } = await render(<SensorChart data={[]} dataKey="moisture" isLoading />);

    expect(getByTestId('sensor-chart-skeleton')).toBeTruthy();
    expect(queryByTestId('sensor-chart-cartesian')).toBeNull();
  });

  it('shows an empty state when there is no data', async () => {
    const { getByTestId, queryByTestId } = await render(
      <SensorChart data={[]} dataKey="moisture" isLoading={false} />
    );

    expect(getByTestId('sensor-chart-empty')).toBeTruthy();
    expect(queryByTestId('sensor-chart-cartesian')).toBeNull();
  });

  it('renders the chart with the transformed data', async () => {
    const { getByTestId } = await render(<SensorChart data={data} dataKey="moisture" isLoading={false} />);

    const chart = getByTestId('sensor-chart-cartesian');
    expect(chart.props.data).toEqual(buildChartData(data, 'moisture'));
    expect(chart.props.xKey).toBe('x');
    expect(chart.props.yKeys).toEqual(['y']);
  });

  it('includes the threshold bounds as extra y keys when thresholdLines is given', async () => {
    const thresholdLines = { ok: [40, 80] as [number, number], attention: [30, 90] as [number, number] };

    const { getByTestId } = await render(
      <SensorChart data={data} dataKey="moisture" isLoading={false} thresholdLines={thresholdLines} />
    );

    const chart = getByTestId('sensor-chart-cartesian');
    expect(chart.props.data).toEqual(buildChartData(data, 'moisture', thresholdLines));
    expect(chart.props.yKeys).toEqual(['y', 'okMin', 'okMax', 'attentionMin', 'attentionMax']);
  });
});
