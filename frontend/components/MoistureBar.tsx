import { StyleSheet, useColorScheme, View } from 'react-native';

import { Colors, Spacing } from '../constants/theme';
import { calculateStatus, STATUS_COLORS } from '../constants/thresholds';

export interface MoistureBarProps {
  value: number;
}

export function MoistureBar({ value }: MoistureBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const clamped = Math.min(100, Math.max(0, value));
  const status = calculateStatus('soilMoisture', value);

  return (
    <View testID="moisture-bar-track" style={[styles.track, { backgroundColor: colors.backgroundSelected }]}>
      <View
        testID="moisture-bar-fill"
        style={[styles.fill, { width: `${clamped}%`, backgroundColor: STATUS_COLORS[status] }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: Spacing.two,
    borderRadius: Spacing.one,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Spacing.one,
  },
});
