import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { LANGUAGES } from '../../constants/i18n';
import { useSettingsStore } from '../../store/settingsStore';

jest.mock('expo-router', () => ({ Stack: { Screen: () => null } }));

import SettingsScreen from '../../app/settings';

describe('SettingsScreen', () => {
  beforeEach(() => {
    useSettingsStore.setState({ notificationsEnabled: true, language: 'en' });
  });

  it('lists every language option', async () => {
    const { getByTestId } = await render(<SettingsScreen />);

    LANGUAGES.forEach((lang) => expect(getByTestId(`language-option-${lang.code}`)).toBeTruthy());
  });

  it('changes and persists the language', async () => {
    const { getByTestId } = await render(<SettingsScreen />);

    await fireEvent.press(getByTestId('language-option-pt-BR'));

    await waitFor(() => expect(useSettingsStore.getState().language).toBe('pt-BR'));
  });

  it('no longer shows a backend URL field (configured via .env)', async () => {
    const { queryByTestId } = await render(<SettingsScreen />);

    expect(queryByTestId('backend-url-input')).toBeNull();
  });

  it('shows the notifications switch reflecting the stored preference', async () => {
    useSettingsStore.setState({ notificationsEnabled: false });

    const { getByTestId } = await render(<SettingsScreen />);

    expect(getByTestId('notifications-switch').props.value).toBe(false);
  });

  it('toggles the notifications preference', async () => {
    const { getByTestId } = await render(<SettingsScreen />);

    await fireEvent(getByTestId('notifications-switch'), 'valueChange', false);

    await waitFor(() => expect(useSettingsStore.getState().notificationsEnabled).toBe(false));
  });
});
