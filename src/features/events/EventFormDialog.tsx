import { useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { TextAreaField } from '@/components/TextAreaField';
import { TextField } from '@/components/TextField';
import { addEvents, deleteEvent, updateEvent, type EventInput } from '@/db/events';
import type { WeddingEvent } from '@/types';
import { parseDate } from '@/utils/date';

export type EventDialogConfig = { mode: 'add' } | { mode: 'edit'; event: WeddingEvent };

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: EventDialogConfig;
  /** The wedding day, to start new events on a sensible date */
  weddingDate: string;
}

interface FormState {
  name: string;
  date: string;
  time: string;
  nakath: string;
  venue: string;
  notes: string;
}

function initialState(config: EventDialogConfig, weddingDate: string): FormState {
  if (config.mode === 'edit') {
    const e = config.event;
    return {
      name: e.name,
      date: e.date ?? '',
      time: e.time ?? '',
      nakath: e.nakath ?? '',
      venue: e.venue ?? '',
      notes: e.notes ?? '',
    };
  }
  return { name: '', date: weddingDate, time: '', nakath: '', venue: '', notes: '' };
}

/** Add / edit / delete one event. Given a fresh `key` each time it opens. */
export function EventFormDialog({ open, onOpenChange, config, weddingDate }: EventFormDialogProps) {
  const isEdit = config.mode === 'edit';
  const [state, setState] = useState<FormState>(() => initialState(config, weddingDate));
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  const update = (patch: Partial<FormState>) => setState((prev) => ({ ...prev, ...patch }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!state.name.trim()) next.name = 'Please name this event.';
    if (state.date && !parseDate(state.date)) next.date = 'Please choose a valid date.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const input: EventInput = {
      name: state.name.trim(),
      date: state.date || undefined,
      time: state.time || undefined,
      nakath: state.nakath || undefined,
      venue: state.venue.trim() || undefined,
      notes: state.notes.trim() || undefined,
    };
    setBusy(true);
    try {
      if (config.mode === 'edit') await updateEvent(config.event.id, input);
      else await addEvents([input]);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (config.mode !== 'edit') return;
    setBusy(true);
    try {
      await deleteEvent(config.event.id);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  if (confirmingDelete) {
    return (
      <Modal
        open={open}
        onOpenChange={onOpenChange}
        title={`Delete ${state.name}?`}
        description="Guests and budget items linked to this event are kept — they just stop being tied to it."
      >
        <div className={form.actions}>
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
            Keep event
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 aria-hidden />}
            onClick={() => void handleDelete()}
            disabled={busy}
          >
            Delete event
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit event' : 'Add an event'}>
      <form className={form.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <TextField
          label="Event name"
          placeholder="e.g. Poruwa ceremony"
          value={state.name}
          maxLength={100}
          error={errors.name}
          onChange={(e) => {
            update({ name: e.target.value });
            setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          autoFocus={!isEdit}
        />
        <div className={form.row}>
          <TextField
            type="date"
            label="Date"
            value={state.date}
            error={errors.date}
            onChange={(e) => {
              update({ date: e.target.value });
              setErrors((prev) => ({ ...prev, date: undefined }));
            }}
          />
          <TextField
            type="time"
            label="Start time"
            value={state.time}
            onChange={(e) => update({ time: e.target.value })}
          />
        </div>
        <TextField
          type="time"
          label="Auspicious time — Nakath / Muhurat (optional)"
          hint="The exact time your astrologer or priest gave you for the key moment."
          value={state.nakath}
          onChange={(e) => update({ nakath: e.target.value })}
        />
        <TextField
          label="Venue (optional)"
          value={state.venue}
          maxLength={200}
          onChange={(e) => update({ venue: e.target.value })}
        />
        <TextAreaField
          label="Notes (optional)"
          placeholder="Dress code, rituals, who to bring…"
          value={state.notes}
          maxLength={1000}
          onChange={(e) => update({ notes: e.target.value })}
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
          <Button type="submit" disabled={busy}>
            {isEdit ? 'Save changes' : 'Add event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
