import { differenceInCalendarDays, format, isValid, parseISO, startOfToday } from 'date-fns';

/** Parses an ISO date string; returns null for empty/invalid input. */
export function parseDate(iso: string | undefined | null): Date | null {
  if (!iso) return null;
  const date = parseISO(iso);
  return isValid(date) ? date : null;
}

/** Date → "2027-06-12" (local date, no time zone shift). */
export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** Whole days from today until the given date. Negative if in the past. */
export function daysUntil(iso: string): number | null {
  const date = parseDate(iso);
  return date ? differenceInCalendarDays(date, startOfToday()) : null;
}

/** "2027-06-12" → "12 June 2027" (or a custom date-fns pattern). */
export function formatDate(iso: string | undefined | null, pattern = 'd MMMM yyyy'): string {
  const date = parseDate(iso);
  return date ? format(date, pattern) : '';
}

/** Today as "yyyy-MM-dd". */
export function todayISO(): string {
  return toISODate(startOfToday());
}

/** True when the date is before today. */
export function isPast(iso: string | undefined | null): boolean {
  const date = parseDate(iso);
  return date ? differenceInCalendarDays(date, startOfToday()) < 0 : false;
}
