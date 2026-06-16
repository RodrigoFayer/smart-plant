import { usePlantStore } from '../../store/plantStore';

describe('plantStore', () => {
  const { set: _set, ...initialState } = usePlantStore.getState();

  beforeEach(() => {
    usePlantStore.setState(initialState);
  });

  it('starts with no sensor data, no plant state, no last watering, and no alerts', () => {
    const state = usePlantStore.getState();

    expect(state.dht11).toBeNull();
    expect(state.soil).toBeNull();
    expect(state.ldr).toBeNull();
    expect(state.mq135).toBeNull();
    expect(state.rain).toBeNull();
    expect(state.plant).toBeNull();
    expect(state.lastWatering).toBeNull();
    expect(state.alerts).toEqual([]);
  });

  it('updates a sensor reading via set', () => {
    const { set } = usePlantStore.getState();

    set((state) => ({ ...state, dht11: { temp: 24, humidity: 62, at: 1720000000 } }));

    expect(usePlantStore.getState().dht11).toEqual({ temp: 24, humidity: 62, at: 1720000000 });
  });

  it('updates the plant state via set', () => {
    const { set } = usePlantStore.getState();

    set((state) => ({ ...state, plant: { state: 'happy', reason: null, color: 'green' } }));

    expect(usePlantStore.getState().plant).toEqual({ state: 'happy', reason: null, color: 'green' });
  });

  it('updates lastWatering via set', () => {
    const { set } = usePlantStore.getState();

    set((state) => ({ ...state, lastWatering: { origin: 'manual_btn', at: 1719900000 } }));

    expect(usePlantStore.getState().lastWatering).toEqual({ origin: 'manual_btn', at: 1719900000 });
  });

  it('only touches the keys returned by the updater, leaving the rest untouched', () => {
    const { set } = usePlantStore.getState();

    set((state) => ({ ...state, soil: { moisture: 65, at: 1720000000 } }));
    set((state) => ({ ...state, mq135: { ppm: 320, at: 1720000001 } }));

    const state = usePlantStore.getState();
    expect(state.soil).toEqual({ moisture: 65, at: 1720000000 });
    expect(state.mq135).toEqual({ ppm: 320, at: 1720000001 });
  });

  it('replaces the alerts list with whatever array the updater returns', () => {
    const { set } = usePlantStore.getState();
    const alert = { type: 'critical', message: 'Soil too dry!', at: 1720000000 };

    set((state) => ({ ...state, alerts: [alert, ...state.alerts] }));

    expect(usePlantStore.getState().alerts).toEqual([alert]);
  });
});
