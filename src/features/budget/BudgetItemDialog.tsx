import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';
import { TextAreaField } from '@/components/TextAreaField';
import { TextField } from '@/components/TextField';
import {
  addBudgetItem,
  deleteBudgetItem,
  updateBudgetItem,
  type BudgetItemInput,
} from '@/db/budget';
import { BUDGET_CATEGORIES, type BudgetItem, type CurrencyCode, type WeddingEvent } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { parseDate } from '@/utils/date';
import { amountToInput, parseAmount } from '@/utils/number';
import styles from './BudgetItemDialog.module.css';

export type BudgetDialogConfig =
  { mode: 'add'; category?: string } | { mode: 'edit'; item: BudgetItem };

interface BudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: BudgetDialogConfig;
  currency: CurrencyCode;
  /** The wedding's events (sorted). When there are none, the Event picker is hidden. */
  events: WeddingEvent[];
}

interface FormState {
  name: string;
  category: string;
  estimated: string;
  actual: string;
  paid: string;
  vendorName: string;
  dueDate: string;
  notes: string;
  /** Event id, or "" for a general cost */
  eventId: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function initialState(config: BudgetDialogConfig): FormState {
  if (config.mode === 'edit') {
    const { item } = config;
    return {
      name: item.name,
      category: item.category,
      estimated: amountToInput(item.estimated),
      actual: amountToInput(item.actual),
      paid: amountToInput(item.paid),
      vendorName: item.vendorName ?? '',
      dueDate: item.dueDate ?? '',
      notes: item.notes ?? '',
      eventId: item.eventId ?? '',
    };
  }
  return {
    name: '',
    category: config.category ?? 'Venue',
    estimated: '',
    actual: '',
    paid: '',
    vendorName: '',
    dueDate: '',
    notes: '',
    eventId: '',
  };
}

const AMOUNT_ERROR = 'Please enter a number, like 50000.';

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim()) errors.name = 'Please give this item a name.';
  if (parseAmount(form.estimated) === null) errors.estimated = AMOUNT_ERROR;
  if (parseAmount(form.actual) === null) errors.actual = AMOUNT_ERROR;
  if (parseAmount(form.paid) === null) errors.paid = AMOUNT_ERROR;
  if (form.dueDate && !parseDate(form.dueDate)) errors.dueDate = 'Please choose a valid date.';
  return errors;
}

/** Add / edit / delete a budget item. Given a fresh `key` each time it opens. */
export function BudgetItemDialog({
  open,
  onOpenChange,
  config,
  currency,
  events,
}: BudgetItemDialogProps) {
  const isEdit = config.mode === 'edit';
  const [form, setForm] = useState<FormState>(() => initialState(config));
  const [errors, setErrors] = useState<FormErrors>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Keep the item's own category in the list even if it's a custom one.
  const categories = (BUDGET_CATEGORIES as readonly string[]).includes(form.category)
    ? BUDGET_CATEGORIES
    : [form.category, ...BUDGET_CATEGORIES];

  const cost = (parseAmount(form.actual) || parseAmount(form.estimated)) ?? 0;
  const paid = parseAmount(form.paid) ?? 0;
  const paidMoreThanCost = cost > 0 && paid > cost;

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    const input: BudgetItemInput = {
      name: form.name.trim(),
      category: form.category,
      estimated: parseAmount(form.estimated) ?? 0,
      actual: parseAmount(form.actual) ?? 0,
      paid: parseAmount(form.paid) ?? 0,
      vendorName: form.vendorName.trim() || undefined,
      dueDate: form.dueDate || undefined,
      notes: form.notes.trim() || undefined,
      // Only keep the link if that event still exists.
      eventId: events.some((e) => e.id === form.eventId) ? form.eventId : undefined,
    };

    setIsSaving(true);
    try {
      if (config.mode === 'edit') await updateBudgetItem(config.item.id, input);
      else await addBudgetItem(input);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (config.mode !== 'edit') return;
    setIsSaving(true);
    try {
      await deleteBudgetItem(config.item.id);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (confirmingDelete) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title="Delete this item?"
        description={`"${form.name}" will be removed from your budget. This can't be undone.`}
      >
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 aria-hidden />}
            onClick={() => void handleDelete()}
            disabled={isSaving}
          >
            Delete item
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit budget item' : 'Add budget item'}
    >
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <div className={styles.row}>
          <TextField
            label="Item"
            placeholder="e.g. Photographer"
            value={form.name}
            maxLength={100}
            error={errors.name}
            onChange={(e) => update('name', e.target.value)}
            autoFocus={!isEdit}
          />
          <SelectField
            label="Category"
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>
        </div>

        {events.length > 0 && (
          <SelectField
            label="Event (optional)"
            hint="Tie this cost to one celebration to see each event's total cost."
            value={form.eventId}
            onChange={(e) => update('eventId', e.target.value)}
          >
            <option value="">General — not tied to an event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </SelectField>
        )}

        <fieldset className={styles.amounts}>
          <legend className={styles.legend}>Amounts ({currency})</legend>
          <TextField
            label="Estimated"
            inputMode="decimal"
            placeholder="0"
            value={form.estimated}
            error={errors.estimated}
            onChange={(e) => update('estimated', e.target.value)}
          />
          <TextField
            label="Actual cost"
            inputMode="decimal"
            placeholder="0"
            value={form.actual}
            error={errors.actual}
            onChange={(e) => update('actual', e.target.value)}
          />
          <TextField
            label="Paid so far"
            inputMode="decimal"
            placeholder="0"
            value={form.paid}
            error={errors.paid}
            onChange={(e) => update('paid', e.target.value)}
          />
        </fieldset>
        <p className={styles.hint}>
          {paidMoreThanCost
            ? `Heads up: you've paid more than the cost (${formatCurrency(cost, currency)}).`
            : 'Leave "Actual cost" empty until you have a final quote — we use the estimate until then.'}
        </p>

        <div className={styles.row}>
          <TextField
            label="Vendor (optional)"
            placeholder="e.g. Lens & Light Studio"
            value={form.vendorName}
            maxLength={100}
            onChange={(e) => update('vendorName', e.target.value)}
          />
          <TextField
            type="date"
            label="Payment due (optional)"
            value={form.dueDate}
            error={errors.dueDate}
            onChange={(e) => update('dueDate', e.target.value)}
          />
        </div>

        <TextAreaField
          label="Notes (optional)"
          placeholder="Deposit details, what's included…"
          value={form.notes}
          maxLength={500}
          onChange={(e) => update('notes', e.target.value)}
        />

        <div className={styles.actions}>
          {isEdit && (
            <Button
              variant="ghost"
              icon={<Trash2 aria-hidden />}
              onClick={() => setConfirmingDelete(true)}
              className={styles.delete}
            >
              Delete
            </Button>
          )}
          <Button type="submit" disabled={isSaving}>
            {isEdit ? 'Save changes' : 'Add item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
