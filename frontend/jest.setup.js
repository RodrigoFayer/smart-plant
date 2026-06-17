jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Default the device locale to English so translated UI strings resolve to
// their English source in tests (assertions check English text).
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageCode: 'en' }] }));
