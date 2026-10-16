import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { ThemePicker } from '@/features/settings/ThemePicker';
import { CURRENCIES, isCurrencyCode } from '@/utils/currency';
import styles from './Steps.module.css';
import type { StepProps } from './types';

export function StepStyle({ draft, errors, onChange }: StepProps) {
  return (
    <div className={styles.fields}>
      <div className={styles.row}>
        <TextField
          label="Total budget (optional)"
          inputMode="decimal"
          placeholder="e.g. 1500000"
          hint="A rough number is fine."
          value={draft.totalBudget}
          error={errors.totalBudget}
          onChange={(e) => onChange({ totalBudget: e.target.value })}
          className={styles.grow}
        />
        <SelectField
          label="Currency"
          value={draft.currency}
          onChange={(e) => {
            const code = e.target.value;
            if (isCurrencyCode(code)) onChange({ currency: code });
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div>
        <p className={styles.groupLabel} aria-hidden>
          Choose your colours
        </p>
        <ThemePicker value={draft.theme} onChange={(theme) => onChange({ theme })} />
      </div>
    </div>
  );
}
