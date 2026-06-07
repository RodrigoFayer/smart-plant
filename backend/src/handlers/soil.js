export function parseSoil(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const { moisture } = payload
  if (typeof moisture !== 'number') return null
  return { moisture }
}
