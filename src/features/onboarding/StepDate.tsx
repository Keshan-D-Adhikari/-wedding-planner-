import { TextField } from '@/components/TextField';
import { todayISO } from '@/utils/date';
import styles from './Steps.module.css';
import type { StepProps } from './types';

export function StepDate({ draft, errors, onChange }: StepProps) {
  return (
    <div className={styles.fields}>
      <TextField
        type="date"
        label="Wedding date"
        hint="No date yet? Pick an estimate — you can change it later."
        min={todayISO()}
        value={draft.weddingDate}
        error={errors.weddingDate}
        onChange={(e) => onChange({ weddingDate: e.target.value })}
        autoFocus
      />
      <TextField
        label="Venue (optional)"
        placeholder="e.g. Mount Lavinia Hotel"
        value={draft.venue}
        onChange={(e) => onChange({ venue: e.target.value })}
        maxLength={120}
      />
    </div>
  );
}
