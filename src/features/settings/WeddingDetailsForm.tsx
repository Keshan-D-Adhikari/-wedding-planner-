import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { ToggleField } from '@/components/ToggleField';
import { updateWeddingDetails } from '@/db/wedding';
import type { ToastTone } from '@/hooks/useToast';
import type { CurrencyCode, Wedding } from '@/types';
import { CURRENCIES, isCurrencyCode } from '@/utils/currency';
import { parseDate } from '@/utils/date';
import { amountToInput, parseAmount } from '@/utils/number';

interface WeddingDetailsFormProps {
  wedding: Wedding;
  notify: (text: string, tone?: ToastTone) => void;
}

interface FormState {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  venue: string;
  totalBudget: string;
  currency: CurrencyCode;
}

type Errors = Partial<Record<keyof FormState, string>>;

function fromWedding(w: Wedding): FormState {
  return {
    partner1Name: w.partner1Name,
    partner2Name: w.partner2Name,
    weddingDate: w.weddingDate,
    venue: w.venue ?? '',
    totalBudget: amountToInput(w.totalBudget),
    currency: w.currency,
  };
}

/** Edit names, date, venue, budget and currency after onboarding. */
export function WeddingDetailsForm({ wedding, notify }: WeddingDetailsFormProps) {
  const [state, setState] = useState<FormState>(() => fromWedding(wedding));
  const [errors, setErrors] = useState<Errors>({});
  const [moveTasks, setMoveTasks] = useState(true);
  const [saving, setSaving] = useState(false);

  const dateChanged = state.weddingDate !== wedding.weddingDate;
  const currencyChanged = state.currency !== wedding.currency;

  function update(patch: Partial<FormState>) {
    setState((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch) as (keyof FormState)[]) delete next[key];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!state.partner1Name.trim()) next.partner1Name = 'Please enter a name.';
    if (!state.partner2Name.trim()) next.partner2Name = 'Please enter a name.';
    if (!parseDate(state.weddingDate)) next.weddingDate = 'Please choose a date.';
    const budget = parseAmount(state.totalBudget);
    if (budget === null) next.totalBudget = 'Please enter a number, like 1500000.';
    setErrors(next);
    if (Object.keys(next).length > 0 || budget === null) return;

    setSaving(true);
    try {
      const moved = await updateWeddingDetails(
        wedding,
        {
          partner1Name: state.partner1Name.trim(),
          partner2Name: state.partner2Name.trim(),
          weddingDate: state.weddingDate,
          venue: state.venue.trim() || undefined,
          totalBudget: budget,
          currency: state.currency,
        },
        moveTasks,
      );
      notify(moved > 0 ? `Details saved · ${moved} task dates moved.` : 'Details saved.');
    } catch (error) {
      console.error('Saving details failed:', error);
      notify('Sorry, your changes could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={form.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
      <div className={form.row}>
        <TextField
          label="Your name"
          value={state.partner1Name}
          maxLength={60}
          error={errors.partner1Name}
          onChange={(e) => update({ partner1Name: e.target.value })}
        />
        <TextField
          label="Your partner's name"
          value={state.partner2Name}
          maxLength={60}
          error={errors.partner2Name}
          onChange={(e) => update({ partner2Name: e.target.value })}
        />
      </div>

      <div className={form.row}>
        <TextField
          type="date"
          label="Wedding date"
          value={state.weddingDate}
          error={errors.weddingDate}
          onChange={(e) => update({ weddingDate: e.target.value })}
        />
        <TextField
          label="Venue (optional)"
          value={state.venue}
          maxLength={120}
          onChange={(e) => update({ venue: e.target.value })}
        />
      </div>
      {dateChanged && (
        <ToggleField
          label="Move my checklist dates too"
          description="Unfinished tasks shift by the same number of days."
          checked={moveTasks}
          onChange={(e) => setMoveTasks(e.target.checked)}
        />
      )}

      <div className={form.row}>
        <TextField
          label="Total budget"
          inputMode="decimal"
          placeholder="0"
          value={state.totalBudget}
          error={errors.totalBudget}
          onChange={(e) => update({ totalBudget: e.target.value })}
        />
        <SelectField
          label="Currency"
          value={state.currency}
          hint={currencyChanged ? "Amounts aren't converted — only the symbol changes." : undefined}
          onChange={(e) => {
            if (isCurrencyCode(e.target.value)) update({ currency: e.target.value });
          }}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className={form.actions}>
        <Button type="submit" icon={<Save aria-hidden />} disabled={saving}>
          {saving ? 'Saving…' : 'Save details'}
        </Button>
      </div>
    </form>
  );
}
