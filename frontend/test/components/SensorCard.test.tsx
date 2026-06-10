import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { SensorCard } from '../../components/SensorCard';
import { STATUS_COLORS } from '../../constants/thresholds';

jest.mock('@expo/vector-icons', () => {
  const { Text: RNText } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => <RNText {...props}>{name}</RNText>,
  };
});

describe('SensorCard', () => {
  const baseProps = {
    title: 'Temperature',
    value: 24,
    unit: '°C',
    status: 'ok' as const,
    icon: 'thermometer-outline',
    updatedAt: 1720000000000,
  };

  it('renders the title', async () => {
    const { getByText } = await render(<SensorCard {...baseProps} />);

    expect(getByText('Temperature')).toBeTruthy();
  });

  it('renders the value with its unit', async () => {
    const { getByText } = await render(<SensorCard {...baseProps} />);

    expect(getByText('24 °C')).toBeTruthy();
  });

  it('renders the icon with the given name', async () => {
    const { getByTestId } = await render(<SensorCard {...baseProps} />);

    expect(getByTestId('sensor-card-icon').props.children).toBe('thermometer-outline');
  });

  it.each([
    ['ok', STATUS_COLORS.ok],
    ['attention', STATUS_COLORS.attention],
    ['critical', STATUS_COLORS.critical],
  ] as const)('shows a %s status badge with the matching color', async (status, color) => {
    const { getByTestId } = await render(<SensorCard {...baseProps} status={status} />);

    const badge = getByTestId('sensor-card-status-badge');
    expect(StyleSheet.flatten(badge.props.style)).toEqual(expect.objectContaining({ backgroundColor: color }));
  });

  it('renders the formatted update time', async () => {
    const { getByText } = await render(<SensorCard {...baseProps} />);

    const expected = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
      new Date(baseProps.updatedAt)
    );
    expect(getByText(expected)).toBeTruthy();
  });
});
