import { matchFont } from '@shopify/react-native-skia';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Area, CartesianChart, Line, Scatter } from 'victory-native';

import { Colors, Spacing } from '../constants/theme';
import { STATUS_COLORS } from '../constants/thresholds';
import { useTranslation } from '../hooks/useTranslation';
import type { HistoryReading } from '../services/api';
import { formatBrasiliaTime } from '../utils/formatTime';

export interface ThresholdLines {
  ok: [number, number];
  attention: [number, number];
}

export interface SensorChartProps {
  data: HistoryReading[];
  dataKey: string;
  isLoading: boolean;
  thresholdLines?: ThresholdLines;
  unit?: string;
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

function formatValue(value: number, unit?: string): string {
  const rounded = Math.round(value * 10) / 10;
  return unit ? `${rounded} ${unit}` : `${rounded}`;
}

export function SensorChart({ data, dataKey, isLoading, thresholdLines, unit }: SensorChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { t } = useTranslation();
  const accent = STATUS_COLORS.ok;

  if (isLoading) {
    return (
      <View testID="sensor-chart-skeleton" style={[styles.placeholder, { backgroundColor: colors.backgroundElement }]} />
    );
  }

  const chartData = buildChartData(data, dataKey, thresholdLines);

  if (chartData.length === 0) {
    return (
      <View testID="sensor-chart-empty" style={[styles.placeholder, { backgroundColor: colors.backgroundElement }]}>
        <Text style={{ color: colors.textSecondary }}>{t('history.noData')}</Text>
      </View>
    );
  }

  const referenceKeys = THRESHOLD_LINE_KEYS.filter((key) => key in chartData[0]);

  // Scale the Y axis to the actual data, not the threshold lines — otherwise a
  // far-off bound (e.g. lux okMin=300 vs. a reading of 100) squashes the data
  // line against the bottom. Threshold lines outside this range are clipped.
  const yValues = chartData.map((point) => point.y);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  const padding = (yMax - yMin || Math.abs(yMax) || 1) * 0.4;
  const domain = { y: [yMin - padding, yMax + padding] as [number, number] };
  const latest = yValues[yValues.length - 1];

  const axisFont = matchFont({ fontFamily: 'System', fontSize: 11 });

  return (
    <View style={styles.container}>
      <View style={styles.stats}>
        {([
          { labelKey: 'chart.now', value: latest },
          { labelKey: 'chart.min', value: yMin },
          { labelKey: 'chart.max', value: yMax },
        ] as const).map(({ labelKey, value }) => (
          <View key={labelKey} style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{t(labelKey)}</Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{formatValue(value, unit)}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.chartBox, { backgroundColor: colors.backgroundElement }]}>
        <CartesianChart
          data={chartData}
          xKey="x"
          yKeys={['y', ...referenceKeys]}
          domain={domain}
          domainPadding={{ top: 16, bottom: 16, left: 12, right: 12 }}
          axisOptions={{
            font: axisFont,
            lineColor: colors.backgroundSelected,
            labelColor: colors.textSecondary,
            tickCount: { x: 4, y: 5 },
            formatXLabel: (ms) => formatBrasiliaTime(ms),
            formatYLabel: (value) => `${Math.round(value)}`,
          }}
        >
          {({ points, chartBounds }) => (
            <>
              {referenceKeys.map((key) => (
                <Line key={key} points={points[key]} color={colors.textSecondary} strokeWidth={1} />
              ))}
              <Area points={points.y} y0={chartBounds.bottom} color={accent} opacity={0.12} curveType="linear" />
              <Line points={points.y} color={accent} strokeWidth={2.5} curveType="linear" />
              <Scatter points={points.y} color={accent} radius={3.5} />
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  chartBox: {
    height: 220,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    overflow: 'hidden',
  },
  placeholder: {
    height: 220,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
