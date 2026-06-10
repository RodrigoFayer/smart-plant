import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { DEFAULT_BACKEND_URL } from '../../constants/env';
import { useSettingsStore } from '../../store/settingsStore';

import SettingsScreen from '../../app/settings';

describe('SettingsScreen', () => {
  beforeEach(() => {
    useSettingsStore.setState({ backendUrl: DEFAULT_BACKEND_URL, notificationsEnabled: true });
  });

  it('shows the current backend URL', async () => {
    useSettingsStore.setState({ backendUrl: 'http://192.168.1.50:3000' });

    const { getByTestId } = await render(<SettingsScreen />);

    expect(getByTestId('backend-url-input').props.value).toBe('http://192.168.1.50:3000');
  });

  it('saves a new backend URL', async () => {
    const { getByTestId } = await render(<SettingsScreen />);

    await fireEvent.changeText(getByTestId('backend-url-input'), 'http://10.0.0.5:3000');
    await fireEvent.press(getByTestId('save-backend-url-button'));

    await waitFor(() => expect(useSettingsStore.getState().backendUrl).toBe('http://10.0.0.5:3000'));
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
