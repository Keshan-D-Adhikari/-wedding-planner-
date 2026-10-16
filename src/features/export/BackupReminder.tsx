import { useState } from 'react';
import { CloudDownload } from 'lucide-react';
import { Button } from '@/components/Button';
import { useBackupStatus } from '@/hooks/useBackupStatus';
import { downloadBackup, snoozeBackupReminder } from './backupActions';
import styles from './BackupReminder.module.css';

/**
 * A gentle nudge on the dashboard. Data lives only in this browser, so a lost
 * phone or cleared history would otherwise mean losing everything.
 */
export function BackupReminder() {
  const status = useBackupStatus();
  const [busy, setBusy] = useState(false);

  if (!status?.shouldRemind) return null;

  return (
    <aside className={styles.reminder} aria-labelledby="backup-reminder-title">
      <span className={styles.icon} aria-hidden>
        <CloudDownload size={22} />
      </span>
      <div className={styles.text}>
        <p id="backup-reminder-title" className={styles.title}>
          {status.daysSince === null
            ? 'Keep your plans safe'
            : `Last backup was ${status.daysSince} days ago`}
        </p>
        <p className={styles.body}>
          Your plans live only in this browser. Download a backup now and then — it takes a second.
        </p>
      </div>
      <div className={styles.actions}>
        <Button
          size="sm"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void downloadBackup().finally(() => setBusy(false));
          }}
        >
          Back up now
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void snoozeBackupReminder()}>
          Later
        </Button>
      </div>
    </aside>
  );
}
