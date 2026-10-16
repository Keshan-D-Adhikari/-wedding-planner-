import { TextField } from '@/components/TextField';
import styles from './Steps.module.css';
import type { StepProps } from './types';

export function StepNames({ draft, errors, onChange }: StepProps) {
  return (
    <div className={styles.fields}>
      <TextField
        label="Your name"
        placeholder="e.g. Amaya"
        autoComplete="given-name"
        value={draft.partner1Name}
        error={errors.partner1Name}
        onChange={(e) => onChange({ partner1Name: e.target.value })}
        maxLength={60}
        autoFocus
      />
      <span className={styles.ampersand} aria-hidden>
        &amp;
      </span>
      <TextField
        label="Your partner's name"
        placeholder="e.g. Kavin"
        autoComplete="off"
        value={draft.partner2Name}
        error={errors.partner2Name}
        onChange={(e) => onChange({ partner2Name: e.target.value })}
        maxLength={60}
      />
    </div>
  );
}
