export function parseLdr(payload) {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null
  const { left, right } = payload
  if (typeof left !== 'number' || typeof right !== 'number') return null
  return { left, right }
}
