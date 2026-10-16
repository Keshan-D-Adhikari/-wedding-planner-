import { useId, useState, type ChangeEvent } from 'react';
import { CloudDownload, RotateCcw, ShieldCheck, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { MAX_BACKUP_BYTES, parseBackup, restoreBackup, type BackupFile } from '@/db/backup';
import { useBackupStatus } from '@/hooks/useBackupStatus';
import type { ToastTone } from '@/hooks/useToast';
import { formatDate } from '@/utils/date';
import { downloadBackup } from './backupActions';
import styles from './ExportPage.module.css';

interface BackupSectionProps {
  notify: (text: string, tone?: ToastTone) => void;
}

function lastBackupText(daysSince: number | null, iso: string | null): string {
  if (daysSince === null || !iso) return "You haven't made a backup yet.";
  if (daysSince === 0) return 'Last backup: today.';
  if (daysSince === 1) return 'Last backup: yesterday.';
  return `Last backup: ${formatDate(iso, 'd MMM yyyy')} (${daysSince} days ago).`;
}

export function BackupSection({ notify }: BackupSectionProps) {
  const status = useBackupStatus();
  const inputId = useId();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function handleBackup() {
    setBusy(true);
    try {
      await downloadBackup();
      notify('Backup saved. Keep it somewhere safe, like Google Drive or email.');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      notify('That file is too large to be a planner backup.', 'error');
      return;
    }
    const result = parseBackup(await file.text());
    if (!result.ok) {
      notify(result.message, 'error');
      return;
    }
    setPending(result.backup);
    setConfirmOpen(true);
  }

  async function handleRestore() {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setConfirmOpen(false);
      notify('Your planner has been restored.');
    } catch (error) {
      console.error('Restore failed:', error);
      notify('Restoring failed — nothing was changed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const d = pending?.data;
  const w = d?.wedding[0];

  return (
    <section className={styles.section} aria-labelledby="backup-heading">
      <div className={styles.sectionHeader}>
        <h2 id="backup-heading" className={styles.sectionTitle}>
          Backup & restore
        </h2>
        <p className={styles.sectionText}>
          Your plans are saved only in this browser. A backup file lets you move to a new phone or
          recover if your browser data is cleared.
        </p>
      </div>

      <div className={styles.backupCard}>
        <p className={styles.backupStatus}>
          <ShieldCheck aria-hidden size={18} />
          {status ? lastBackupText(status.daysSince, status.lastBackupAt) : '…'}
        </p>
        <div className={styles.buttons}>
          <Button
            icon={<CloudDownload aria-hidden />}
            onClick={() => void handleBackup()}
            disabled={busy}
          >
            Download backup
          </Button>
          <input
            id={inputId}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            onChange={(e) => void handleFile(e)}
          />
          <label htmlFor={inputId} className={styles.fileButton}>
            <RotateCcw aria-hidden size={18} />
            Restore from file
          </label>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Replace everything with this backup?"
        description="Everything currently in your planner will be replaced. This can't be undone — download a backup of your current plans first if you might need them."
      >
        {d && w && (
          <div className={form.form}>
            <div className={form.note}>
              <p>
                <strong>
                  {w.partner1Name} &amp; {w.partner2Name}
                </strong>{' '}
                · {formatDate(w.weddingDate, 'd MMM yyyy')}
              </p>
              <p>
                {d.tasks.length} tasks · {d.budgetItems.length} budget items · {d.guests.length}{' '}
                guests · {d.seatingTables.length} tables
              </p>
              {pending?.exportedAt && (
                <p>Backup made on {formatDate(pending.exportedAt, 'd MMM yyyy, HH:mm')}</p>
              )}
            </div>
            <div className={form.actions}>
              <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={<TriangleAlert aria-hidden />}
                onClick={() => void handleRestore()}
                disabled={busy}
              >
                Replace & restore
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
