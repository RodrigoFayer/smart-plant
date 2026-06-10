import { render } from '@testing-library/react-native';

import { MOUTH_PATHS, Tamagotchi } from '../../components/Tamagotchi';
import type { PlantState } from '../../store/plantStore';

const ALL_STATES: PlantState[] = ['happy', 'thirsty', 'hot', 'noLight', 'sick', 'sleeping'];

describe('Tamagotchi', () => {
  it('renders the character SVG', async () => {
    const { getByTestId } = await render(<Tamagotchi state="happy" />);

    expect(getByTestId('tamagotchi-svg')).toBeTruthy();
  });

  it('defines a distinct mouth shape for every state', () => {
    const shapes = new Set(ALL_STATES.map((state) => MOUTH_PATHS[state]));

    expect(shapes.size).toBe(ALL_STATES.length);
  });

  it.each(ALL_STATES)('renders the matching mouth shape for the %s state', async (state) => {
    const { getByTestId } = await render(<Tamagotchi state={state} />);

    expect(getByTestId('tamagotchi-mouth').props.d).toBe(MOUTH_PATHS[state]);
  });

  it('shows open eyes while awake', async () => {
    const { getByTestId } = await render(<Tamagotchi state="happy" />);

    expect(getByTestId('tamagotchi-eye-left').props.ry).toBeGreaterThan(1);
    expect(getByTestId('tamagotchi-eye-right').props.ry).toBeGreaterThan(1);
  });

  it('shows closed eyes while sleeping', async () => {
    const { getByTestId } = await render(<Tamagotchi state="sleeping" />);

    expect(getByTestId('tamagotchi-eye-left').props.ry).toBeLessThanOrEqual(1);
    expect(getByTestId('tamagotchi-eye-right').props.ry).toBeLessThanOrEqual(1);
  });

  it.each([
    ['thirsty', 'tamagotchi-particle-drop'],
    ['hot', 'tamagotchi-particle-heat'],
    ['sleeping', 'tamagotchi-particle-zzz'],
  ] as const)('shows the %s particle for the %s state', async (state, testId) => {
    const { getByTestId } = await render(<Tamagotchi state={state} />);

    expect(getByTestId(testId)).toBeTruthy();
  });

  it.each(['happy', 'noLight', 'sick'] as const)('shows no particle for the %s state', async (state) => {
    const { queryByTestId } = await render(<Tamagotchi state={state} />);

    expect(queryByTestId('tamagotchi-particle-drop')).toBeNull();
    expect(queryByTestId('tamagotchi-particle-heat')).toBeNull();
    expect(queryByTestId('tamagotchi-particle-zzz')).toBeNull();
  });
});
