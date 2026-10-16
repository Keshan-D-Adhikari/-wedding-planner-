import { useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { TextField } from '@/components/TextField';
import { updateWedding } from '@/db/wedding';
import type { Wedding } from '@/types';
import { amountToInput, parseAmount } from '@/utils/number';
import styles from './BudgetItemDialog.module.css';

interface TotalBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wedding: Wedding;
}

/** Edits the overall wedding budget. Given a fresh `key` each time it opens. */
export function TotalBudgetDialog({ open, onOpenChange, wedding }: TotalBudgetDialogProps) {
  const [value, setValue] = useState(() => amountToInput(wedding.totalBudget));
  const [error, setError] = useState<string>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = parseAmount(value);
    if (amount === null) {
      setError('Please enter a number, like 1500000.');
      return;
    }
    await updateWedding(wedding.id, { totalBudget: amount });
    onOpenChange(false);
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Total budget"
      description="The most you'd like to spend on the whole wedding."
    >
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <TextField
          label={`Total budget (${wedding.currency})`}
          inputMode="decimal"
          placeholder="e.g. 1500000"
          value={value}
          error={error}
          onChange={(e) => {
            setValue(e.target.value);
            setError(undefined);
          }}
          autoFocus
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit">Save budget</Button>
        </div>
      </form>
    </Modal>
  );
}
