import { StyleSheet, Text, View } from 'react-native';

import { Spacing } from '../constants/theme';
import { SensorStatus, STATUS_COLORS } from '../constants/thresholds';
import { Alert } from '../store/plantStore';

export interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <View testID="alert-banner">
      {alerts.map((alert, index) => (
        <View
          key={`${alert.at}-${index}`}
          testID="alert-banner-item"
          style={[
            styles.item,
            { backgroundColor: STATUS_COLORS[alert.type as SensorStatus] ?? STATUS_COLORS.critical },
          ]}
        >
          <Text style={styles.message}>{alert.message}</Text>
          <Text style={styles.time}>
            {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(alert.at))}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.two,
    borderRadius: Spacing.one,
    marginBottom: Spacing.one,
  },
  message: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '600',
  },
  time: {
    marginLeft: Spacing.two,
    color: '#ffffff',
    fontSize: 12,
  },
});
