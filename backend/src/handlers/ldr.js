export function parseLdr(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const { lux } = payload
  if (typeof lux !== 'number') return null
  return { lux }
}
