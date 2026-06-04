/**
 * Money is stored everywhere as integer **cents** to avoid floating-point
 * rounding errors in the app's core profit math. Convert to/from dollars and
 * format only at the display edge.
 */

/** Convert a dollar amount (e.g. from a text input) to integer cents. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/** Parse a user-typed string like "12.50" or "$1,200" into integer cents. */
export function parseDollarsToCents(input: string): number {
  const cleaned = input.replace(/[^0-9.-]/g, '');
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return 0;
  return dollarsToCents(value);
}

/** Convert integer cents back to a dollar number. */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format integer cents as currency, e.g. 32050 -> "$320.50".
 * `currency` is an ISO 4217 code (default USD).
 */
export function formatMoney(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(centsToDollars(cents));
}

/** Format a ratio (0..1) as a percentage string, e.g. 0.64 -> "64%". */
export function formatPercent(ratio: number | null, fractionDigits = 0): string {
  if (ratio === null || !Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toFixed(fractionDigits)}%`;
}
