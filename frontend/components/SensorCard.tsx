import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

import { Colors, Spacing } from '../constants/theme';
import { SensorStatus, STATUS_COLORS } from '../constants/thresholds';

export interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  status: SensorStatus;
  icon: string;
  updatedAt: number;
}

export function SensorCard({ title, value, unit, status, icon, updatedAt }: SensorCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const updatedAtLabel = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
    new Date(updatedAt)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.header}>
        <Ionicons testID="sensor-card-icon" name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View testID="sensor-card-status-badge" style={[styles.badge, { backgroundColor: STATUS_COLORS[status] }]} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>
        {value} {unit}
      </Text>
      <Text style={[styles.updatedAt, { color: colors.textSecondary }]}>{updatedAtLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    width: Spacing.two,
    height: Spacing.two,
    borderRadius: Spacing.two,
  },
  value: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  updatedAt: {
    fontSize: 12,
  },
});
