import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner } from '../components/AlertBanner';
import { MoistureBar } from '../components/MoistureBar';
import { SensorCard } from '../components/SensorCard';
import { Tamagotchi } from '../components/Tamagotchi';
import { Colors, Spacing } from '../constants/theme';
import { calculateStatus, SensorStatus, STATUS_COLORS } from '../constants/thresholds';
import { useSocket } from '../hooks/useSocket';
import { PlantState, usePlantStore } from '../store/plantStore';

export const STATE_MESSAGES: Record<PlantState, string> = {
  happy: "I'm doing great! 🌱",
  thirsty: "I'm thirsty... 💧",
  hot: "It's too hot! 🥵",
  noLight: 'I need more light ☀️',
  sick: "I'm not feeling well 😟",
  sleeping: 'Zzz... 😴',
};

const RELATIVE_TIME_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Infinity, unit: 'years' },
];

export function formatRelativeTime(at: number, now: number = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
  let duration = (at - now) / 1000;

  for (const { amount, unit } of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < amount) {
      return rtf.format(Math.round(duration), unit);
    }
    duration /= amount;
  }

  return rtf.format(Math.round(duration), 'years');
}

function statusFor(sensor: 'temp' | 'airHumidity' | 'lux' | 'ppm', value: number | undefined): SensorStatus {
  return value === undefined ? 'ok' : calculateStatus(sensor, value);
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { connected } = useSocket();

  const dht11 = usePlantStore((s) => s.dht11);
  const soil = usePlantStore((s) => s.soil);
  const ldr = usePlantStore((s) => s.ldr);
  const mq135 = usePlantStore((s) => s.mq135);
  const rain = usePlantStore((s) => s.rain);
  const plant = usePlantStore((s) => s.plant);
  const lastWatering = usePlantStore((s) => s.lastWatering);
  const alerts = usePlantStore((s) => s.alerts);

  const plantState: PlantState = plant?.state ?? 'happy';
  const lux = ldr ? ldr.lux : undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Smart Plant</Text>
        <View style={styles.headerActions}>
          <View
            testID="connection-indicator"
            style={[styles.connectionDot, { backgroundColor: connected ? STATUS_COLORS.ok : STATUS_COLORS.critical }]}
          />
          <Pressable testID="history-button" onPress={() => router.push('/history')}>
            <Ionicons name="stats-chart-outline" size={22} color={colors.text} />
          </Pressable>
          <Pressable testID="settings-button" onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.tamagotchiSection}>
        <View style={styles.tamagotchi}>
          <Tamagotchi state={plantState} />
        </View>
        <Text style={[styles.stateMessage, { color: colors.text }]}>{STATE_MESSAGES[plantState]}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <SensorCard
            title="Temperature"
            value={dht11?.temp ?? '--'}
            unit="°C"
            status={statusFor('temp', dht11?.temp)}
            icon="thermometer-outline"
            updatedAt={dht11?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title="Air Humidity"
            value={dht11?.humidity ?? '--'}
            unit="%"
            status={statusFor('airHumidity', dht11?.humidity)}
            icon="water-outline"
            updatedAt={dht11?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Soil Moisture</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{soil ? `${soil.moisture}%` : '--'}</Text>
            <MoistureBar value={soil?.moisture ?? 0} />
          </View>
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title="Light"
            value={lux ?? '--'}
            unit="lux"
            status={statusFor('lux', lux)}
            icon="sunny-outline"
            updatedAt={ldr?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title="Air Quality"
            value={mq135?.ppm ?? '--'}
            unit="ppm"
            status={statusFor('ppm', mq135?.ppm)}
            icon="cloud-outline"
            updatedAt={mq135?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title="Rain"
            value={rain ? (rain.detected ? 'Yes' : 'No') : '--'}
            unit=""
            status="ok"
            icon="rainy-outline"
            updatedAt={rain?.at ?? 0}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Last watering</Text>
        <Text style={{ color: colors.textSecondary }}>
          {lastWatering ? `${formatRelativeTime(lastWatering.at)} — ${lastWatering.origin}` : 'No watering recorded yet'}
        </Text>
        <Pressable
          testID="log-watering-button"
          style={[styles.button, { backgroundColor: colors.backgroundSelected }]}
          // No backend endpoint exists yet to log a manual watering (see backend/docs/api-and-realtime.md);
          // this is a UI placeholder until that's added.
          onPress={() => {}}
        >
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Log watering now</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent alerts</Text>
        {alerts.length === 0 ? <Text style={{ color: colors.textSecondary }}>No recent alerts</Text> : <AlertBanner alerts={alerts} />}
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  connectionDot: { width: Spacing.two, height: Spacing.two, borderRadius: Spacing.two },
  tamagotchiSection: { alignItems: 'center', gap: Spacing.one },
  tamagotchi: { width: 160, height: 160 },
  stateMessage: { fontSize: 16, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  gridItem: { width: '48%' },
  card: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.one },
  cardTitle: { fontSize: 14, fontWeight: '600' },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  section: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  button: { padding: Spacing.two, borderRadius: Spacing.one, alignItems: 'center' },
  buttonLabel: { fontWeight: '600' },
});
