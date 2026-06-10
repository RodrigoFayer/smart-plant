import { BACKEND_URL, fetchHistory, fetchStatus } from '../../services/api';

describe('services/api', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  describe('fetchStatus', () => {
    it('GETs /status and returns the parsed JSON', async () => {
      const payload = {
        plant: { state: 'happy', reason: null },
        sensors: {
          dht11: { temp: 24, humidity: 62, at: 1720000000 },
          soil: { moisture: 65, at: 1720000000 },
        },
        lastWatering: { origin: 'manual_btn', at: 1719900000 },
      };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => payload,
      });

      const result = await fetchStatus();

      expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/status`);
      expect(result).toEqual(payload);
    });

    it('throws when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500 });

      await expect(fetchStatus()).rejects.toThrow();
    });
  });

  describe('fetchHistory', () => {
    it('GETs /history with the sensor and defaults period to 24h', async () => {
      const payload = [{ sensor: 'soil', data: { moisture: 45 }, at: 1720000000 }];
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => payload,
      });

      const result = await fetchHistory('soil');

      expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/history?sensor=soil&period=24h`);
      expect(result).toEqual(payload);
    });

    it('GETs /history with a custom period', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await fetchHistory('dht11', '7d');

      expect(global.fetch).toHaveBeenCalledWith(`${BACKEND_URL}/history?sensor=dht11&period=7d`);
    });

    it('throws when the response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 400 });

      await expect(fetchHistory('soil')).rejects.toThrow();
    });
  });
});
