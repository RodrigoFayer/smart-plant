import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';

import { SensorChart, ThresholdLines } from '../components/SensorChart';
import type { TranslationKey } from '../constants/i18n';
import { Colors, Spacing } from '../constants/theme';
import { THRESHOLDS } from '../constants/thresholds';
import { useHistory } from '../hooks/useHistory';
import { useTranslation } from '../hooks/useTranslation';
import type { HistoryPeriod } from '../services/api';

export interface MetricOption {
  key: string;
  labelKey: TranslationKey;
  sensor: string;
  dataKey: string;
  unit: string;
  thresholdKey?: keyof typeof THRESHOLDS;
}

export const METRICS: MetricOption[] = [
  { key: 'temp', labelKey: 'sensor.temperature', sensor: 'dht11', dataKey: 'temp', unit: '°C', thresholdKey: 'temp' },
  { key: 'humidity', labelKey: 'sensor.airHumidity', sensor: 'dht11', dataKey: 'humidity', unit: '%', thresholdKey: 'airHumidity' },
  { key: 'soilMoisture', labelKey: 'sensor.soilMoisture', sensor: 'soil', dataKey: 'moisture', unit: '%', thresholdKey: 'soilMoisture' },
  { key: 'light', labelKey: 'sensor.light', sensor: 'ldr', dataKey: 'lux', unit: 'lux', thresholdKey: 'lux' },
  { key: 'ppm', labelKey: 'sensor.airQuality', sensor: 'mq135', dataKey: 'ppm', unit: 'ppm', thresholdKey: 'ppm' },
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
  const { t } = useTranslation();

  const [metricKey, setMetricKey] = useState(METRICS[0].key);
  const [period, setPeriod] = useState<HistoryPeriod>('1h');

  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];
  const { data, isLoading } = useHistory(metric.sensor, period);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: t('history.title') }} />
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
            <Text style={{ color: colors.text }}>{t(m.labelKey)}</Text>
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
        unit={metric.unit}
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
