export function parseRain(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const { detected } = payload
  if (typeof detected !== 'boolean') return null
  return { detected }
}
