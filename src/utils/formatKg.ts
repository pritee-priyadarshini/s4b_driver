/** Format a weight for UI — always includes the kg unit. */
export function formatKgLabel(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 kg';
  const rounded = Math.round(n * 1000) / 1000;
  const label = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${label} kg`;
}
