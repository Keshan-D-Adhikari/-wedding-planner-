/**
 * Parses a money amount typed by the user.
 * Empty → 0, "1,500,000" → 1500000, negatives or text → null (invalid).
 */
export function parseAmount(value: string): number | null {
  const cleaned = value.replace(/[,\s]/g, '');
  if (cleaned === '') return 0;
  const amount = Number(cleaned);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/** Shows a stored amount in an input: 0 → "" (so the placeholder shows), 1500 → "1500". */
export function amountToInput(amount: number): string {
  return amount > 0 ? String(amount) : '';
}
