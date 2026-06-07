export function parseMq135(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const { ppm } = payload
  if (typeof ppm !== 'number') return null
  return { ppm }
}
