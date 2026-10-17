import { useId, useState, type ChangeEvent } from 'react';
import { HeartHandshake } from 'lucide-react';
import { MAX_BACKUP_BYTES, parseBackup, restoreBackup } from '@/db/backup';
import styles from './OnboardingPage.module.css';

interface ImportPartnerPlanProps {
  onError: (message: string | null) => void;
}

/**
 * For the second partner on a new phone (or anyone restoring a backup): skip setup
 * and load the plan file instead. Once loaded, the app leaves this screen by itself.
 */
export function ImportPartnerPlan({ onError }: ImportPartnerPlanProps) {
  const inputId = useId();
  const [busy, setBusy] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    onError(null);
    if (file.size > MAX_BACKUP_BYTES) {
      onError('That file is too large to be a wedding plan.');
      return;
    }
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      onError(parsed.message);
      return;
    }
    setBusy(true);
    try {
      await restoreBackup(parsed.backup);
    } catch (error) {
      console.error('Import failed:', error);
      onError('Sorry, that plan could not be loaded. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className={styles.importBox}>
      <input
        id={inputId}
        type="file"
        accept=".json,application/json"
        className="visually-hidden"
        onChange={(e) => void handleFile(e)}
        disabled={busy}
      />
      <label htmlFor={inputId} className={styles.importLink}>
        <HeartHandshake aria-hidden size={16} />
        {busy ? 'Loading your plan…' : 'Got a plan from your partner, or a backup? Import it'}
      </label>
    </div>
  );
}
