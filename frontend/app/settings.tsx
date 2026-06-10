import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, useColorScheme, View } from 'react-native';

import { Colors, Spacing } from '../constants/theme';
import { useSettingsStore } from '../store/settingsStore';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];

  const backendUrl = useSettingsStore((s) => s.backendUrl);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const setBackendUrl = useSettingsStore((s) => s.setBackendUrl);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);

  const [draftUrl, setDraftUrl] = useState(backendUrl);
  const [saved, setSaved] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Backend server</Text>
        <TextInput
          testID="backend-url-input"
          style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSelected }]}
          value={draftUrl}
          onChangeText={(text) => {
            setDraftUrl(text);
            setSaved(false);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="http://192.168.1.100:3000"
          placeholderTextColor={colors.textSecondary}
        />
        <Pressable
          testID="save-backend-url-button"
          style={[styles.button, { backgroundColor: colors.backgroundSelected }]}
          onPress={async () => {
            await setBackendUrl(draftUrl);
            setSaved(true);
          }}
        >
          <Text style={[styles.buttonLabel, { color: colors.text }]}>Save</Text>
        </Pressable>
        {saved && <Text style={{ color: colors.textSecondary }}>Saved</Text>}
      </View>

      <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.row}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Critical alert notifications</Text>
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
  input: { borderRadius: Spacing.one, padding: Spacing.two },
  button: { padding: Spacing.two, borderRadius: Spacing.one, alignItems: 'center' },
  buttonLabel: { fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
