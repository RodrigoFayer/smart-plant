import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { calculateStatus, STATUS_COLORS } from '../../constants/thresholds';
import { useSocket } from '../../hooks/useSocket';
import { usePlantStore } from '../../store/plantStore';

jest.mock('../../hooks/useSocket', () => ({
  useSocket: jest.fn(() => ({ connected: true })),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

jest.mock('../../components/Tamagotchi', () => ({
  Tamagotchi: ({ state }: { state: string }) => {
    const { Text } = require('react-native');
    return <Text testID="tamagotchi">{state}</Text>;
  },
}));

jest.mock('../../components/SensorCard', () => ({
  SensorCard: (props: Record<string, unknown>) => {
    const { Text } = require('react-native');
    return <Text testID={`sensor-card-${props.title}`}>{JSON.stringify(props)}</Text>;
  },
}));

jest.mock('../../components/MoistureBar', () => ({
  MoistureBar: ({ value }: { value: number }) => {
    const { Text } = require('react-native');
    return <Text testID="moisture-bar">{value}</Text>;
  },
}));

jest.mock('../../components/AlertBanner', () => ({
  AlertBanner: ({ alerts }: { alerts: unknown[] }) => {
    const { Text } = require('react-native');
    return <Text testID="alert-banner">{JSON.stringify(alerts)}</Text>;
  },
}));

import HomeScreen, { formatRelativeTime, STATE_MESSAGES } from '../../app/index';

function sensorCardProps(getByTestId: (id: string) => any, title: string) {
  return JSON.parse(getByTestId(`sensor-card-${title}`).props.children);
}

describe('formatRelativeTime', () => {
  const now = 1_720_000_000_000;

  it.each([
    [30 * 1000, '30 seconds ago'],
    [5 * 60 * 1000, '5 minutes ago'],
    [3 * 60 * 60 * 1000, '3 hours ago'],
    [2 * 24 * 60 * 60 * 1000, '2 days ago'],
    [10 * 24 * 60 * 60 * 1000, '1 week ago'],
  ])('formats %d ms in the past as "%s"', (ms, expected) => {
    expect(formatRelativeTime(now - ms, now)).toBe(expected);
  });
});

describe('HomeScreen', () => {
  const { set: _set, ...initialState } = usePlantStore.getState();

  beforeEach(() => {
    usePlantStore.setState(initialState);
    (useSocket as jest.Mock).mockReturnValue({ connected: true });
  });

  it('renders the header title', async () => {
    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Smart Plant')).toBeTruthy();
  });

  it('navigates to the history screen', async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    const { getByTestId } = await render(<HomeScreen />);
    await fireEvent.press(getByTestId('history-button'));

    expect(push).toHaveBeenCalledWith('/history');
  });

  it('navigates to the settings screen', async () => {
    const push = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push });

    const { getByTestId } = await render(<HomeScreen />);
    await fireEvent.press(getByTestId('settings-button'));

    expect(push).toHaveBeenCalledWith('/settings');
  });

  it('shows a green connection indicator when connected', async () => {
    (useSocket as jest.Mock).mockReturnValue({ connected: true });

    const { getByTestId } = await render(<HomeScreen />);

    expect(StyleSheet.flatten(getByTestId('connection-indicator').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: STATUS_COLORS.ok })
    );
  });

  it('shows a red connection indicator when disconnected', async () => {
    (useSocket as jest.Mock).mockReturnValue({ connected: false });

    const { getByTestId } = await render(<HomeScreen />);

    expect(StyleSheet.flatten(getByTestId('connection-indicator').props.style)).toEqual(
      expect.objectContaining({ backgroundColor: STATUS_COLORS.critical })
    );
  });

  it.each([
    ['happy', STATE_MESSAGES?.happy],
    ['thirsty', STATE_MESSAGES?.thirsty],
    ['hot', STATE_MESSAGES?.hot],
    ['noLight', STATE_MESSAGES?.noLight],
    ['sick', STATE_MESSAGES?.sick],
    ['sleeping', STATE_MESSAGES?.sleeping],
  ] as const)('shows the Tamagotchi and message for the %s state', async (state, message) => {
    usePlantStore.setState({ plant: { state, reason: null, color: 'green' } });

    const { getByTestId, getByText } = await render(<HomeScreen />);

    expect(getByTestId('tamagotchi').props.children).toBe(state);
    expect(getByText(message as string)).toBeTruthy();
  });

  it('defaults to the happy state when the plant state is unknown', async () => {
    usePlantStore.setState({ plant: null });

    const { getByTestId } = await render(<HomeScreen />);

    expect(getByTestId('tamagotchi').props.children).toBe('happy');
  });

  it('shows the temperature and air humidity from the dht11 reading', async () => {
    usePlantStore.setState({ dht11: { temp: 24, humidity: 62, at: 1720000000000 } });

    const { getByTestId } = await render(<HomeScreen />);

    expect(sensorCardProps(getByTestId, 'Temperature')).toEqual(
      expect.objectContaining({
        value: 24,
        unit: '°C',
        status: calculateStatus('temp', 24),
        updatedAt: 1720000000000,
      })
    );
    expect(sensorCardProps(getByTestId, 'Air Humidity')).toEqual(
      expect.objectContaining({
        value: 62,
        unit: '%',
        status: calculateStatus('airHumidity', 62),
        updatedAt: 1720000000000,
      })
    );
  });

  it('shows a placeholder for sensors with no data yet', async () => {
    const { getByTestId } = await render(<HomeScreen />);

    expect(sensorCardProps(getByTestId, 'Temperature')).toEqual(expect.objectContaining({ value: '--' }));
  });

  it('shows the soil moisture value and bar', async () => {
    usePlantStore.setState({ soil: { moisture: 65, at: 1720000000000 } });

    const { getByText, getByTestId } = await render(<HomeScreen />);

    expect(getByText('65%')).toBeTruthy();
    expect(getByTestId('moisture-bar').props.children).toBe(65);
  });

  it('shows the average light level from the ldr reading', async () => {
    usePlantStore.setState({ ldr: { left: 680, right: 540, at: 1720000000000 } });

    const { getByTestId } = await render(<HomeScreen />);

    expect(sensorCardProps(getByTestId, 'Light')).toEqual(
      expect.objectContaining({ value: 610, unit: 'lux', status: calculateStatus('lux', 610) })
    );
  });

  it('shows the air quality reading from mq135', async () => {
    usePlantStore.setState({ mq135: { ppm: 320, at: 1720000000000 } });

    const { getByTestId } = await render(<HomeScreen />);

    expect(sensorCardProps(getByTestId, 'Air Quality')).toEqual(
      expect.objectContaining({ value: 320, unit: 'ppm', status: calculateStatus('ppm', 320) })
    );
  });

  it('shows the atmospheric pressure from bmp180', async () => {
    usePlantStore.setState({ bmp180: { pressure: 1013, at: 1720000000000 } });

    const { getByTestId } = await render(<HomeScreen />);

    expect(sensorCardProps(getByTestId, 'Pressure')).toEqual(expect.objectContaining({ value: 1013, unit: 'hPa' }));
  });

  it.each([
    [true, 'Yes'],
    [false, 'No'],
  ] as const)('shows rain detected (%s) as "%s"', async (detected, label) => {
    usePlantStore.setState({ rain: { detected, at: 1720000000000 } });

    const { getByTestId } = await render(<HomeScreen />);

    expect(sensorCardProps(getByTestId, 'Rain')).toEqual(expect.objectContaining({ value: label }));
  });

  it('shows the relative time and origin of the last watering', async () => {
    const now = 1_720_000_000_000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    usePlantStore.setState({ lastWatering: { origin: 'manual_btn', at: now - 2 * 24 * 60 * 60 * 1000 } });

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('2 days ago — manual_btn')).toBeTruthy();
  });

  it('shows a placeholder when there is no watering history', async () => {
    usePlantStore.setState({ lastWatering: null });

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('No watering recorded yet')).toBeTruthy();
  });

  it('renders a pressable "Log watering now" button', async () => {
    const { getByTestId, getByText } = await render(<HomeScreen />);

    expect(getByText('Log watering now')).toBeTruthy();
    expect(() => fireEvent.press(getByTestId('log-watering-button'))).not.toThrow();
  });

  it('shows recent alerts from the store', async () => {
    const alerts = [{ type: 'critical', message: 'Soil too dry!', at: 1720000000000 }];
    usePlantStore.setState({ alerts });

    const { getByTestId } = await render(<HomeScreen />);

    expect(JSON.parse(getByTestId('alert-banner').props.children)).toEqual(alerts);
  });

  it('shows a message when there are no recent alerts', async () => {
    usePlantStore.setState({ alerts: [] });

    const { getByText, queryByTestId } = await render(<HomeScreen />);

    expect(getByText('No recent alerts')).toBeTruthy();
    expect(queryByTestId('alert-banner')).toBeNull();
  });
});
