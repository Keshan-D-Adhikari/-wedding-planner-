import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { SelectField } from '@/components/SelectField';
import { TextAreaField } from '@/components/TextAreaField';
import { TextField } from '@/components/TextField';
import { addTask, deleteTask, updateTask, type TaskInput } from '@/db/tasks';
import {
  TASK_CATEGORIES,
  TIMEFRAMES,
  type ChecklistTask,
  type TaskCategory,
  type Timeframe,
} from '@/types';
import { parseDate } from '@/utils/date';
import { isOneOf } from '@/utils/guards';
import styles from './TaskFormDialog.module.css';
import { TIMEFRAME_LABELS } from './timeframeLabels';

const MAX_TITLE = 120;
const MAX_NOTES = 500;

/** What the dialog is opened for: a new task (optionally in a timeframe) or an existing one. */
export type TaskDialogConfig =
  { mode: 'add'; timeframe?: Timeframe } | { mode: 'edit'; task: ChecklistTask };

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: TaskDialogConfig;
}

interface FormState {
  title: string;
  notes: string;
  category: TaskCategory;
  timeframe: Timeframe;
  dueDate: string;
}

function initialState(config: TaskDialogConfig): FormState {
  if (config.mode === 'edit') {
    const { task } = config;
    return {
      title: task.title,
      notes: task.notes ?? '',
      category: task.category,
      timeframe: task.timeframe,
      dueDate: task.dueDate ?? '',
    };
  }
  return {
    title: '',
    notes: '',
    category: 'Other',
    timeframe: config.timeframe ?? '1 month',
    dueDate: '',
  };
}

/**
 * Add / edit / delete a task. The parent gives this component a new `key` each time it
 * opens, so the form always starts from fresh values.
 */
export function TaskFormDialog({ open, onOpenChange, config }: TaskFormDialogProps) {
  const isEdit = config.mode === 'edit';
  const [form, setForm] = useState<FormState>(() => initialState(config));
  const [titleError, setTitleError] = useState<string>();
  const [dateError, setDateError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  function update(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const nextTitleError = !title ? 'Please give the task a name.' : undefined;
    const nextDateError =
      form.dueDate && !parseDate(form.dueDate) ? 'Please choose a valid date.' : undefined;
    setTitleError(nextTitleError);
    setDateError(nextDateError);
    if (nextTitleError || nextDateError) return;

    const input: TaskInput = {
      title,
      notes: form.notes.trim() || undefined,
      category: form.category,
      timeframe: form.timeframe,
      dueDate: form.dueDate || undefined,
    };

    setIsSaving(true);
    try {
      if (config.mode === 'edit') await updateTask(config.task.id, input);
      else await addTask(input);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (config.mode !== 'edit') return;
    setIsSaving(true);
    try {
      await deleteTask(config.task.id);
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
        title="Delete this task?"
        description={`"${form.title}" will be removed from your checklist. This can't be undone.`}
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
            Delete task
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit task' : 'Add a task'}>
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <TextField
          label="Task"
          placeholder="e.g. Book a henna artist"
          value={form.title}
          maxLength={MAX_TITLE}
          error={titleError}
          onChange={(e) => {
            update({ title: e.target.value });
            setTitleError(undefined);
          }}
          autoFocus={!isEdit}
        />

        <div className={styles.row}>
          <SelectField
            label="Category"
            value={form.category}
            onChange={(e) => {
              if (isOneOf(TASK_CATEGORIES, e.target.value)) update({ category: e.target.value });
            }}
          >
            {TASK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="When"
            value={form.timeframe}
            onChange={(e) => {
              if (isOneOf(TIMEFRAMES, e.target.value)) update({ timeframe: e.target.value });
            }}
          >
            {TIMEFRAMES.map((timeframe) => (
              <option key={timeframe} value={timeframe}>
                {TIMEFRAME_LABELS[timeframe]}
              </option>
            ))}
          </SelectField>
        </div>

        <TextField
          type="date"
          label="Due date (optional)"
          value={form.dueDate}
          error={dateError}
          onChange={(e) => {
            update({ dueDate: e.target.value });
            setDateError(undefined);
          }}
        />

        <TextAreaField
          label="Notes (optional)"
          placeholder="Vendor contact, ideas, links…"
          value={form.notes}
          maxLength={MAX_NOTES}
          onChange={(e) => update({ notes: e.target.value })}
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
            {isEdit ? 'Save changes' : 'Add task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
