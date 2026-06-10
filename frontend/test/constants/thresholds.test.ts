import { STATUS_COLORS, THRESHOLDS, calculateStatus } from '../../constants/thresholds';

describe('STATUS_COLORS', () => {
  it('maps each status to a semantic color', () => {
    expect(STATUS_COLORS.ok).toBe('#4CAF50');
    expect(STATUS_COLORS.attention).toBe('#FFC107');
    expect(STATUS_COLORS.critical).toBe('#F44336');
  });
});

describe('THRESHOLDS', () => {
  it('defines ok/attention ranges and units for every sensor', () => {
    expect(THRESHOLDS.temp).toEqual({ ok: [18, 30], attention: [10, 35], unit: '°C' });
    expect(THRESHOLDS.airHumidity).toEqual({ ok: [40, 70], attention: [30, 80], unit: '%' });
    expect(THRESHOLDS.soilMoisture).toEqual({ ok: [40, 80], attention: [30, 90], unit: '%' });
    expect(THRESHOLDS.lux).toEqual({ ok: [300, Infinity], attention: [100, Infinity], unit: 'lux' });
    expect(THRESHOLDS.ppm).toEqual({ ok: [0, 400], attention: [0, 600], unit: 'ppm' });
  });
});

describe('calculateStatus', () => {
  describe('temp', () => {
    it.each([
      [18, 'ok'],
      [24, 'ok'],
      [30, 'ok'],
      [10, 'attention'],
      [17, 'attention'],
      [31, 'attention'],
      [35, 'attention'],
      [9, 'critical'],
      [36, 'critical'],
    ] as const)('%i°C -> %s', (value, expected) => {
      expect(calculateStatus('temp', value)).toBe(expected);
    });
  });

  describe('airHumidity', () => {
    it.each([
      [40, 'ok'],
      [55, 'ok'],
      [70, 'ok'],
      [30, 'attention'],
      [39, 'attention'],
      [71, 'attention'],
      [80, 'attention'],
      [29, 'critical'],
      [81, 'critical'],
    ] as const)('%i%% -> %s', (value, expected) => {
      expect(calculateStatus('airHumidity', value)).toBe(expected);
    });
  });

  describe('soilMoisture', () => {
    it.each([
      [40, 'ok'],
      [60, 'ok'],
      [80, 'ok'],
      [30, 'attention'],
      [39, 'attention'],
      [81, 'attention'],
      [90, 'attention'],
      [29, 'critical'],
      [91, 'critical'],
    ] as const)('%i%% -> %s', (value, expected) => {
      expect(calculateStatus('soilMoisture', value)).toBe(expected);
    });
  });

  describe('lux', () => {
    it.each([
      [300, 'ok'],
      [1000, 'ok'],
      [100, 'attention'],
      [299, 'attention'],
      [99, 'critical'],
      [0, 'critical'],
    ] as const)('%i lux -> %s', (value, expected) => {
      expect(calculateStatus('lux', value)).toBe(expected);
    });
  });

  describe('ppm', () => {
    it.each([
      [0, 'ok'],
      [200, 'ok'],
      [400, 'ok'],
      [401, 'attention'],
      [600, 'attention'],
      [601, 'critical'],
      [1000, 'critical'],
    ] as const)('%i ppm -> %s', (value, expected) => {
      expect(calculateStatus('ppm', value)).toBe(expected);
    });
  });
});
