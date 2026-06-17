import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertBanner } from '../components/AlertBanner';
import { MoistureBar } from '../components/MoistureBar';
import { SensorCard } from '../components/SensorCard';
import { Tamagotchi } from '../components/Tamagotchi';
import { formatRelativeTime, type TranslationKey } from '../constants/i18n';
import { Colors, Spacing } from '../constants/theme';
import { calculateStatus, SensorStatus, STATUS_COLORS } from '../constants/thresholds';
import { useSocket } from '../hooks/useSocket';
import { useTranslation } from '../hooks/useTranslation';
import { logWatering } from '../services/api';
import { PlantState, usePlantStore } from '../store/plantStore';

export const STATE_MESSAGE_KEYS: Record<PlantState, TranslationKey> = {
  happy: 'state.happy',
  thirsty: 'state.thirsty',
  hot: 'state.hot',
  noLight: 'state.noLight',
  sick: 'state.sick',
  sleeping: 'state.sleeping',
};

function wateringOriginKey(origin: string): TranslationKey {
  return origin === 'app' ? 'watering.app' : 'watering.manual_btn';
}

function statusFor(sensor: 'temp' | 'airHumidity' | 'lux' | 'ppm', value: number | undefined): SensorStatus {
  return value === undefined ? 'ok' : calculateStatus(sensor, value);
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const router = useRouter();
  const { connected } = useSocket();
  const { t, language } = useTranslation();

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
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('app.title')}</Text>
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
        <Text style={[styles.stateMessage, { color: colors.text }]}>{t(STATE_MESSAGE_KEYS[plantState])}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <SensorCard
            title={t('sensor.temperature')}
            value={dht11?.temp ?? '--'}
            unit="°C"
            status={statusFor('temp', dht11?.temp)}
            icon="thermometer-outline"
            updatedAt={dht11?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title={t('sensor.airHumidity')}
            value={dht11?.humidity ?? '--'}
            unit="%"
            status={statusFor('airHumidity', dht11?.humidity)}
            icon="water-outline"
            updatedAt={dht11?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sensor.soilMoisture')}</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{soil ? `${soil.moisture}%` : '--'}</Text>
            <MoistureBar value={soil?.moisture ?? 0} />
          </View>
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title={t('sensor.light')}
            value={lux ?? '--'}
            unit="lux"
            status={statusFor('lux', lux)}
            icon="sunny-outline"
            updatedAt={ldr?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title={t('sensor.airQuality')}
            value={mq135?.ppm ?? '--'}
            unit="ppm"
            status={statusFor('ppm', mq135?.ppm)}
            icon="cloud-outline"
            updatedAt={mq135?.at ?? 0}
          />
        </View>
        <View style={styles.gridItem}>
          <SensorCard
            title={t('sensor.rain')}
            value={rain ? (rain.detected ? t('common.yes') : t('common.no')) : '--'}
            unit=""
            status="ok"
            icon="rainy-outline"
            updatedAt={rain?.at ?? 0}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.lastWatering')}</Text>
        <Text style={{ color: colors.textSecondary }}>
          {lastWatering
            ? `${formatRelativeTime(lastWatering.at, Date.now(), language)} — ${t(wateringOriginKey(lastWatering.origin))}`
            : t('home.noWatering')}
        </Text>
        <Pressable
          testID="log-watering-button"
          style={[styles.button, { backgroundColor: colors.backgroundSelected }]}
          onPress={() => {
            logWatering().catch(() => {});
          }}
        >
          <Text style={[styles.buttonLabel, { color: colors.text }]}>{t('home.logWatering')}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('home.recentAlerts')}</Text>
        {alerts.length === 0 ? <Text style={{ color: colors.textSecondary }}>{t('home.noAlerts')}</Text> : <AlertBanner alerts={alerts} />}
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
