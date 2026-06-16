import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { SensorChart, ThresholdLines } from '../components/SensorChart';
import { Colors, Spacing } from '../constants/theme';
import { THRESHOLDS } from '../constants/thresholds';
import { useHistory } from '../hooks/useHistory';
import type { HistoryPeriod } from '../services/api';

export interface MetricOption {
  key: string;
  label: string;
  sensor: string;
  dataKey: string;
  unit: string;
  thresholdKey?: keyof typeof THRESHOLDS;
}

export const METRICS: MetricOption[] = [
  { key: 'temp', label: 'Temperature', sensor: 'dht11', dataKey: 'temp', unit: '°C', thresholdKey: 'temp' },
  { key: 'humidity', label: 'Air Humidity', sensor: 'dht11', dataKey: 'humidity', unit: '%', thresholdKey: 'airHumidity' },
  { key: 'soilMoisture', label: 'Soil Moisture', sensor: 'soil', dataKey: 'moisture', unit: '%', thresholdKey: 'soilMoisture' },
  { key: 'light', label: 'Light', sensor: 'ldr', dataKey: 'lux', unit: 'lux', thresholdKey: 'lux' },
  { key: 'ppm', label: 'Air Quality', sensor: 'mq135', dataKey: 'ppm', unit: 'ppm', thresholdKey: 'ppm' },
];

export const PERIODS: HistoryPeriod[] = ['1h', '24h', '7d', '30d'];

function thresholdLinesFor(thresholdKey?: keyof typeof THRESHOLDS): ThresholdLines | undefined {
  if (!thresholdKey) return undefined;
  const { ok, attention } = THRESHOLDS[thresholdKey];
  return { ok, attention };
}

export default function HistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const [metricKey, setMetricKey] = useState(METRICS[0].key);
  const [period, setPeriod] = useState<HistoryPeriod>('24h');

  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];
  const { data, isLoading } = useHistory(metric.sensor, period);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.pickerRow}>
        {METRICS.map((m) => (
          <Pressable
            key={m.key}
            testID={`metric-option-${m.key}`}
            onPress={() => setMetricKey(m.key)}
            style={[
              styles.chip,
              { backgroundColor: m.key === metricKey ? colors.backgroundSelected : colors.backgroundElement },
            ]}
          >
            <Text style={{ color: colors.text }}>{m.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.pickerRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p}
            testID={`period-option-${p}`}
            onPress={() => setPeriod(p)}
            style={[
              styles.chip,
              { backgroundColor: p === period ? colors.backgroundSelected : colors.backgroundElement },
            ]}
          >
            <Text style={{ color: colors.text }}>{p}</Text>
          </Pressable>
        ))}
      </View>

      <SensorChart
        data={data ?? []}
        dataKey={metric.dataKey}
        isLoading={isLoading}
        thresholdLines={thresholdLinesFor(metric.thresholdKey)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  pickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
});
