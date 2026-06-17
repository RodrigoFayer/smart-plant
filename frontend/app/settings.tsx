import { Stack } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, useColorScheme, View } from 'react-native';

import { LANGUAGES } from '../constants/i18n';
import { Colors, Spacing } from '../constants/theme';
import { useTranslation } from '../hooks/useTranslation';
import { useSettingsStore } from '../store/settingsStore';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { t, language } = useTranslation();

  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: t('settings.title') }} />

      <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.language')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              testID={`language-option-${lang.code}`}
              onPress={() => setLanguage(lang.code)}
              style={[
                styles.chip,
                { backgroundColor: lang.code === language ? colors.backgroundSelected : colors.background },
              ]}
            >
              <Text style={{ color: colors.text }}>{lang.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.row}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.notifications')}</Text>
          <Switch testID="notifications-switch" value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  section: { borderRadius: Spacing.two, padding: Spacing.three, gap: Spacing.two },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: Spacing.two },
  chip: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
