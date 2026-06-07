export function parseDht11(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const { temp, humidity } = payload
  if (typeof temp !== 'number' || typeof humidity !== 'number') return null
  return { temp, humidity }
}
