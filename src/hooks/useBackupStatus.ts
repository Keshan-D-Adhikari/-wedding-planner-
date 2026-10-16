import { differenceInCalendarDays, parseISO } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';

/** How long before we gently remind people to back up again. */
export const BACKUP_REMINDER_DAYS = 14;

export interface BackupStatus {
  lastBackupAt: string | null;
  /** Whole days since the last backup, or null if never */
  daysSince: number | null;
  /** True when a reminder should be shown (and hasn't been dismissed recently) */
  shouldRemind: boolean;
}

function daysAgo(iso: string | undefined): number | null {
  if (!iso) return null;
  const date = parseISO(iso);
  return Number.isNaN(date.getTime()) ? null : differenceInCalendarDays(new Date(), date);
}

export function useBackupStatus(): BackupStatus | undefined {
  return useLiveQuery(async () => {
    const [last, dismissed, wedding, guestCount, itemCount] = await Promise.all([
      db.meta.get('lastBackupAt'),
      db.meta.get('backupReminderDismissedAt'),
      db.wedding.toCollection().first(),
      db.guests.count(),
      db.budgetItems.count(),
    ]);

    const daysSince = daysAgo(last?.value);
    const daysSinceDismissed = daysAgo(dismissed?.value);
    const daysSinceCreated = daysAgo(wedding?.createdAt) ?? 0;

    // Only nag once there's something worth losing.
    const hasRealData = guestCount > 0 || itemCount > 0 || daysSinceCreated >= 3;
    const due = daysSince === null || daysSince >= BACKUP_REMINDER_DAYS;
    const snoozed = daysSinceDismissed !== null && daysSinceDismissed < BACKUP_REMINDER_DAYS;

    return {
      lastBackupAt: last?.value ?? null,
      daysSince,
      shouldRemind: Boolean(wedding) && hasRealData && due && !snoozed,
    };
  });
}
