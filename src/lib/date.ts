import { format, parseISO } from 'date-fns';

/** "2026-06-04" -> "Jun 4, 2026". Falls back to the raw value if unparseable. */
export function formatMarketDate(isoDate: string): string {
  try {
    return format(parseISO(isoDate), 'MMM d, yyyy');
  } catch {
    return isoDate;
  }
}

/** Today's date as yyyy-MM-dd (used as the default for new markets). */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
