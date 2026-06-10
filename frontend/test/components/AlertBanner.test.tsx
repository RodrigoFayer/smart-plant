import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AlertBanner } from '../../components/AlertBanner';
import { STATUS_COLORS } from '../../constants/thresholds';
import type { Alert } from '../../store/plantStore';

describe('AlertBanner', () => {
  it('renders nothing when there are no alerts', async () => {
    const { toJSON } = await render(<AlertBanner alerts={[]} />);

    expect(toJSON()).toBeNull();
  });

  it('renders each alert message', async () => {
    const alerts: Alert[] = [
      { type: 'critical', message: 'Soil too dry!', at: 1720000000000 },
      { type: 'attention', message: 'Temperature rising', at: 1720000100000 },
    ];

    const { getByText } = await render(<AlertBanner alerts={alerts} />);

    expect(getByText('Soil too dry!')).toBeTruthy();
    expect(getByText('Temperature rising')).toBeTruthy();
  });

  it('renders the formatted timestamp for each alert', async () => {
    const alerts: Alert[] = [{ type: 'critical', message: 'Soil too dry!', at: 1720000000000 }];

    const { getByText } = await render(<AlertBanner alerts={alerts} />);

    const expected = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(
      new Date(alerts[0].at)
    );
    expect(getByText(expected)).toBeTruthy();
  });

  it.each([
    ['critical', STATUS_COLORS.critical],
    ['attention', STATUS_COLORS.attention],
  ] as const)('colors a %s alert with the matching status color', async (type, color) => {
    const alerts: Alert[] = [{ type, message: 'Something happened', at: 1720000000000 }];

    const { getByTestId } = await render(<AlertBanner alerts={alerts} />);

    const item = getByTestId('alert-banner-item');
    expect(StyleSheet.flatten(item.props.style)).toEqual(expect.objectContaining({ backgroundColor: color }));
  });

  it('falls back to the critical color for an unknown alert type', async () => {
    const alerts: Alert[] = [{ type: 'unknown', message: 'Mystery alert', at: 1720000000000 }];

    const { getByTestId } = await render(<AlertBanner alerts={alerts} />);

    const item = getByTestId('alert-banner-item');
    expect(StyleSheet.flatten(item.props.style)).toEqual(
      expect.objectContaining({ backgroundColor: STATUS_COLORS.critical })
    );
  });

  it('renders one item per alert', async () => {
    const alerts: Alert[] = [
      { type: 'critical', message: 'Alert 1', at: 1 },
      { type: 'critical', message: 'Alert 2', at: 2 },
      { type: 'critical', message: 'Alert 3', at: 3 },
    ];

    const { getAllByTestId } = await render(<AlertBanner alerts={alerts} />);

    expect(getAllByTestId('alert-banner-item')).toHaveLength(3);
  });
});
