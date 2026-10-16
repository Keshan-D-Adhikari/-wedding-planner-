import { useId, useMemo, useState, type FormEvent } from 'react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextAreaField } from '@/components/TextAreaField';
import { TextField } from '@/components/TextField';
import { addGuests } from '@/db/guests';
import type { Guest, GuestSide, RsvpStatus } from '@/types';
import {
  DEFAULT_GROUPS,
  MAX_PASTED_NAMES,
  parsePastedNames,
  RSVP_OPTIONS,
  sideOptions,
  type Partners,
} from './guestUtils';

interface BulkAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: Partners;
  guests: Guest[];
  onAdded: (count: number) => void;
}

/** Paste a list of names (one per line) and add them all with shared details. */
export function BulkAddDialog({
  open,
  onOpenChange,
  partners,
  guests,
  onAdded,
}: BulkAddDialogProps) {
  const [text, setText] = useState('');
  const [side, setSide] = useState<GuestSide>('both');
  const [rsvp, setRsvp] = useState<RsvpStatus>('pending');
  const [group, setGroup] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const groupListId = useId();

  const parsed = useMemo(() => parsePastedNames(text, guests), [text, guests]);
  const count = parsed.names.length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (count === 0) return;
    setIsSaving(true);
    try {
      await addGuests(
        parsed.names.map((name) => ({
          name,
          side,
          rsvp,
          group: group.trim() || undefined,
          plusOne: false,
          tableId: null,
        })),
      );
      onAdded(count);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add many guests"
      description="Paste names from your notes, WhatsApp or a spreadsheet — one per line."
    >
      <form className={form.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <TextAreaField
          label="Names"
          placeholder={'Nimali Perera\nRuwan Silva\nDilini Fernando'}
          rows={7}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <p className={form.note} role="status">
          {count === 0 && parsed.duplicates === 0
            ? 'Names will appear here as you paste them.'
            : `${count} new ${count === 1 ? 'guest' : 'guests'} to add`}
          {parsed.duplicates > 0 && ` · ${parsed.duplicates} already on your list (skipped)`}
          {parsed.truncated && ` · only the first ${MAX_PASTED_NAMES} will be added`}
        </p>

        <SegmentedControl
          label="Whose guests?"
          showLabel
          options={sideOptions(partners)}
          value={side}
          onChange={setSide}
        />
        <SegmentedControl
          label="RSVP"
          showLabel
          options={RSVP_OPTIONS}
          value={rsvp}
          onChange={setRsvp}
        />
        <TextField
          label="Group (optional)"
          placeholder="Family, Friends, Work…"
          list={groupListId}
          value={group}
          maxLength={60}
          onChange={(e) => setGroup(e.target.value)}
        />
        <datalist id={groupListId}>
          {DEFAULT_GROUPS.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>

        <div className={form.actions}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving || count === 0}>
            {count > 0 ? `Add ${count} ${count === 1 ? 'guest' : 'guests'}` : 'Add guests'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
