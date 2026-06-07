export function parseBmp180(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const { pressure, altitude } = payload
  if (typeof pressure !== 'number' || typeof altitude !== 'number') return null
  return { pressure, altitude }
}
