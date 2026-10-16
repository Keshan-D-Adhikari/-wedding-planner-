import { createBackup, setMeta } from '@/db/backup';
import { todayISO } from '@/utils/date';
import { downloadFile } from '@/utils/download';

/** Saves every bit of planner data as one JSON file on the user's device. */
export async function downloadBackup(): Promise<void> {
  const backup = await createBackup();
  downloadFile(
    JSON.stringify(backup, null, 2),
    `wedding-planner-backup-${todayISO()}.json`,
    'application/json',
  );
  await setMeta('lastBackupAt', backup.exportedAt);
}

export async function snoozeBackupReminder(): Promise<void> {
  await setMeta('backupReminderDismissedAt', new Date().toISOString());
}
