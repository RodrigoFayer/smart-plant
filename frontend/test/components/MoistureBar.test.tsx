import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { MoistureBar } from '../../components/MoistureBar';
import { STATUS_COLORS } from '../../constants/thresholds';

describe('MoistureBar', () => {
  it('fills proportionally to the moisture value', async () => {
    const { getByTestId } = await render(<MoistureBar value={45} />);

    const fill = getByTestId('moisture-bar-fill');
    expect(StyleSheet.flatten(fill.props.style)).toEqual(expect.objectContaining({ width: '45%' }));
  });

  it.each([
    [60, STATUS_COLORS.ok],
    [35, STATUS_COLORS.attention],
    [10, STATUS_COLORS.critical],
  ])('colors the fill based on the soil moisture status for %i%%', async (value, color) => {
    const { getByTestId } = await render(<MoistureBar value={value} />);

    const fill = getByTestId('moisture-bar-fill');
    expect(StyleSheet.flatten(fill.props.style)).toEqual(expect.objectContaining({ backgroundColor: color }));
  });

  it('clamps the fill width to 100% when the value exceeds 100', async () => {
    const { getByTestId } = await render(<MoistureBar value={120} />);

    const fill = getByTestId('moisture-bar-fill');
    expect(StyleSheet.flatten(fill.props.style)).toEqual(expect.objectContaining({ width: '100%' }));
  });

  it('clamps the fill width to 0% when the value is negative', async () => {
    const { getByTestId } = await render(<MoistureBar value={-10} />);

    const fill = getByTestId('moisture-bar-fill');
    expect(StyleSheet.flatten(fill.props.style)).toEqual(expect.objectContaining({ width: '0%' }));
  });
});
