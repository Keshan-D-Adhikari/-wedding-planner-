import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { addTables, deleteTable, updateTable, type TableInput } from '@/db/seating';
import type { SeatingTable, TableShape } from '@/types';
import { clampPosition, findFreeSpot, MAX_CAPACITY, MIN_CAPACITY, tableSize } from './seatingUtils';

export type TableDialogConfig =
  { mode: 'add' } | { mode: 'edit'; table: SeatingTable; used: number };

const SHAPES: readonly { value: TableShape; label: string }[] = [
  { value: 'round', label: 'Round' },
  { value: 'rectangle', label: 'Long' },
];
const MAX_AT_ONCE = 20;

interface TableFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TableDialogConfig;
  tables: SeatingTable[];
  onSaved: (message: string) => void;
}

/** Highest "Table N" number in use, so new tables continue the sequence. */
function nextTableNumber(tables: SeatingTable[]): number {
  const numbers = tables.map((t) => /^Table (\d+)$/.exec(t.name)?.[1]).map(Number);
  return Math.max(0, ...numbers.filter(Number.isFinite)) + 1;
}

/** Add one or many tables, or edit / delete one. Given a fresh `key` each time it opens. */
export function TableFormDialog({
  open,
  onOpenChange,
  config,
  tables,
  onSaved,
}: TableFormDialogProps) {
  const isEdit = config.mode === 'edit';
  const firstNumber = nextTableNumber(tables);

  const [name, setName] = useState(isEdit ? config.table.name : `Table ${firstNumber}`);
  const [shape, setShape] = useState<TableShape>(isEdit ? config.table.shape : 'round');
  const [capacity, setCapacity] = useState(String(isEdit ? config.table.capacity : 8));
  const [count, setCount] = useState('1');
  const [errors, setErrors] = useState<{ name?: string; capacity?: string; count?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const howMany = Number(count);
  const addingMany = !isEdit && Number.isInteger(howMany) && howMany > 1;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const seats = Number(capacity);
    const used = config.mode === 'edit' ? config.used : 0;
    const next: typeof errors = {};

    if (!addingMany && !name.trim()) next.name = 'Please give the table a name.';
    if (!Number.isInteger(seats) || seats < MIN_CAPACITY || seats > MAX_CAPACITY) {
      next.capacity = `Choose between ${MIN_CAPACITY} and ${MAX_CAPACITY} seats.`;
    } else if (seats < used) {
      next.capacity = `${used} seats are already taken. Move some guests first.`;
    }
    if (!isEdit && (!Number.isInteger(howMany) || howMany < 1 || howMany > MAX_AT_ONCE)) {
      next.count = `Add between 1 and ${MAX_AT_ONCE} tables at a time.`;
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);
    try {
      const size = tableSize(shape, seats);
      if (config.mode === 'edit') {
        // A bigger table might now poke out of the room — nudge it back in.
        const pos = clampPosition(config.table.x, config.table.y, size);
        await updateTable(config.table.id, { name: name.trim(), shape, capacity: seats, ...pos });
        onSaved(`${name.trim()} updated.`);
      } else {
        const placed = [...tables];
        const inputs: TableInput[] = [];
        for (let i = 0; i < howMany; i++) {
          const pos = findFreeSpot(placed, size);
          const input: TableInput = {
            name: addingMany ? `Table ${firstNumber + i}` : name.trim(),
            shape,
            capacity: seats,
            ...pos,
          };
          inputs.push(input);
          placed.push({ ...input, id: `pending-${i}` });
        }
        await addTables(inputs);
        onSaved(
          howMany === 1 ? `${inputs[0]?.name ?? 'Table'} added.` : `${howMany} tables added.`,
        );
      }
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (config.mode !== 'edit') return;
    setIsSaving(true);
    try {
      await deleteTable(config.table.id);
      onSaved(`${config.table.name} deleted.`);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  if (confirmingDelete && config.mode === 'edit') {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={`Delete ${config.table.name}?`}
        description={
          config.used > 0
            ? 'Everyone sitting here will move back to Unseated. Your guests are not deleted.'
            : 'This empty table will be removed from your floor plan.'
        }
      >
        <div className={form.actions}>
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
            Keep table
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 aria-hidden />}
            onClick={() => void handleDelete()}
            disabled={isSaving}
          >
            Delete table
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit table' : 'Add tables'}>
      <form className={form.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        {!isEdit && (
          <TextField
            label="How many tables?"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_AT_ONCE}
            value={count}
            error={errors.count}
            onChange={(e) => setCount(e.target.value)}
          />
        )}
        {addingMany ? (
          <p className={form.note}>
            They'll be named Table {firstNumber} to Table {firstNumber + howMany - 1}. You can
            rename any of them later.
          </p>
        ) : (
          <TextField
            label="Table name"
            placeholder="e.g. Family table"
            value={name}
            maxLength={40}
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <SegmentedControl
          label="Shape"
          showLabel
          options={SHAPES}
          value={shape}
          onChange={setShape}
        />
        <TextField
          label="Seats per table"
          type="number"
          inputMode="numeric"
          min={MIN_CAPACITY}
          max={MAX_CAPACITY}
          value={capacity}
          error={errors.capacity}
          hint="Guests bringing a plus-one use two seats."
          onChange={(e) => setCapacity(e.target.value)}
        />

        <div className={form.actions}>
          {isEdit && (
            <Button
              variant="ghost"
              icon={<Trash2 aria-hidden />}
              onClick={() => setConfirmingDelete(true)}
              className={form.delete}
            >
              Delete
            </Button>
          )}
          <Button type="submit" disabled={isSaving}>
            {isEdit ? 'Save changes' : addingMany ? `Add ${howMany} tables` : 'Add table'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
