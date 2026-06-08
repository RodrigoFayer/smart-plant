import express from 'express'

const PERIODS = {
  '1h':  3_600,
  '24h': 86_400,
  '7d':  604_800,
  '30d': 2_592_000,
}

export function createApp({ store, db }) {
  const app = express()

  app.get('/status', (req, res) => {
    const state = store.getState()
    res.json({
      plant: state ? { state: state.state, reason: state.reason } : null,
      sensors: store.getReadings(),
      lastWatering: db.getLatestWatering(),
    })
  })

  app.get('/history', (req, res) => {
    const { sensor, period = '24h' } = req.query
    if (!sensor) return res.status(400).json({ error: 'sensor param is required' })
    const seconds = PERIODS[period]
    if (!seconds) return res.status(400).json({ error: `period must be one of: ${Object.keys(PERIODS).join(', ')}` })
    res.json(db.getReadings({ sensor, since: Date.now() - seconds * 1000 }))
  })

  return app
}
