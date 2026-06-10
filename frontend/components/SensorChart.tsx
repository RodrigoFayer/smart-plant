import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { CartesianChart, Line } from 'victory-native';

import { Colors, Spacing } from '../constants/theme';
import type { HistoryReading } from '../services/api';

export interface ThresholdLines {
  ok: [number, number];
  attention: [number, number];
}

export interface SensorChartProps {
  data: HistoryReading[];
  dataKey: string;
  isLoading: boolean;
  thresholdLines?: ThresholdLines;
}

const THRESHOLD_LINE_KEYS = ['okMin', 'okMax', 'attentionMin', 'attentionMax'] as const;

export function buildChartData(
  data: HistoryReading[],
  dataKey: string,
  thresholdLines?: ThresholdLines
): Record<string, number>[] {
  const points = data
    .filter((reading) => typeof reading.data[dataKey] === 'number')
    .map((reading) => ({ x: reading.at, y: reading.data[dataKey] as number }));

  if (!thresholdLines) {
    return points;
  }

  const bounds: Record<string, number> = {
    okMin: thresholdLines.ok[0],
    okMax: thresholdLines.ok[1],
    attentionMin: thresholdLines.attention[0],
    attentionMax: thresholdLines.attention[1],
  };
  const finiteBounds = Object.fromEntries(Object.entries(bounds).filter(([, value]) => Number.isFinite(value)));

  return points.map((point) => ({ ...point, ...finiteBounds }));
}

export function SensorChart({ data, dataKey, isLoading, thresholdLines }: SensorChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  if (isLoading) {
    return (
      <View testID="sensor-chart-skeleton" style={[styles.placeholder, { backgroundColor: colors.backgroundElement }]} />
    );
  }

  const chartData = buildChartData(data, dataKey, thresholdLines);

  if (chartData.length === 0) {
    return (
      <View testID="sensor-chart-empty" style={[styles.placeholder, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.textSecondary }}>No data available</Text>
      </View>
    );
  }

  const referenceKeys = THRESHOLD_LINE_KEYS.filter((key) => key in chartData[0]);

  return (
    <View style={styles.container}>
      <CartesianChart data={chartData} xKey="x" yKeys={['y', ...referenceKeys]}>
        {({ points }) => (
          <>
            <Line points={points.y} color={colors.text} strokeWidth={2} />
            {referenceKeys.map((key) => (
              <Line key={key} points={points[key]} color={colors.textSecondary} strokeWidth={1} />
            ))}
          </>
        )}
      </CartesianChart>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
  },
  placeholder: {
    height: 200,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
