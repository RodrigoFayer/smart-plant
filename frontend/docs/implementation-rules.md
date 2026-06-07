# Implementation rules

- Never fetch directly inside components — use hooks or the store
- All timestamps arrive as Unix epoch — format with `Intl.DateTimeFormat` or `date-fns`
- Clearly show a "disconnected" state when Socket.IO disconnects
- Support light and dark themes natively (`useColorScheme` from React Native)
- The backend's IP lives in `.env` and can be changed in the settings screen without recompiling (persist in AsyncStorage)
- Push notifications for critical alerts using `expo-notifications` — request permission on first launch
