// Brazil (America/Sao_Paulo) has used a fixed UTC-3 offset since the 2019 DST repeal.
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;

export function formatBrasiliaTime(at: number): string {
  const date = new Date(at - BRASILIA_OFFSET_MS);
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}
