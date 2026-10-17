import { useId, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { SegmentedControl } from '@/components/SegmentedControl';
import { TextField } from '@/components/TextField';
import { ToggleField } from '@/components/ToggleField';
import { addGuest, deleteGuest, updateGuest, type GuestInput } from '@/db/guests';
import type { Guest, GuestSide, RsvpStatus, WeddingEvent } from '@/types';
import { EventInviteField } from './EventInviteField';
import {
  DEFAULT_GROUPS,
  normalizeName,
  RSVP_OPTIONS,
  sideOptions,
  type Partners,
} from './guestUtils';

export type GuestDialogConfig = { mode: 'add' } | { mode: 'edit'; guest: Guest };

interface GuestFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: GuestDialogConfig;
  partners: Partners;
  /** All guests — for group/meal suggestions and the duplicate-name hint */
  guests: Guest[];
  /** The wedding's events (sorted). When there are none, the invite picker is hidden. */
  events: WeddingEvent[];
}

interface FormState {
  name: string;
  side: GuestSide;
  group: string;
  rsvp: RsvpStatus;
  plusOne: boolean;
  mealChoice: string;
  dietary: string;
  phone: string;
  email: string;
  /** Events the guest is invited to (all of them by default). */
  eventIds: string[];
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function initialState(config: GuestDialogConfig, events: WeddingEvent[]): FormState {
  const allEvents = events.map((e) => e.id);
  if (config.mode === 'edit') {
    const g = config.guest;
    return {
      name: g.name,
      side: g.side,
      group: g.group ?? '',
      rsvp: g.rsvp,
      plusOne: g.plusOne,
      mealChoice: g.mealChoice ?? '',
      dietary: g.dietary ?? '',
      phone: g.phone ?? '',
      email: g.email ?? '',
      eventIds: g.eventIds ?? allEvents,
    };
  }
  return {
    name: '',
    side: 'both',
    group: '',
    rsvp: 'pending',
    plusOne: false,
    mealChoice: '',
    dietary: '',
    phone: '',
    email: '',
    eventIds: allEvents,
  };
}

const unique = (values: (string | undefined)[]) =>
  [...new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))].sort();

/** Add / edit / delete one guest. Given a fresh `key` each time it opens. */
export function GuestFormDialog({
  open,
  onOpenChange,
  config,
  partners,
  guests,
  events,
}: GuestFormDialogProps) {
  const isEdit = config.mode === 'edit';
  const [state, setState] = useState<FormState>(() => initialState(config, events));
  const [nameError, setNameError] = useState<string>();
  const [emailError, setEmailError] = useState<string>();
  const [eventError, setEventError] = useState<string>();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const groupListId = useId();
  const mealListId = useId();

  const groupSuggestions = unique([...DEFAULT_GROUPS, ...guests.map((g) => g.group)]);
  const mealSuggestions = unique(guests.map((g) => g.mealChoice));

  const editingId = config.mode === 'edit' ? config.guest.id : null;
  const duplicate =
    state.name.trim() !== '' &&
    guests.some((g) => g.id !== editingId && normalizeName(g.name) === normalizeName(state.name));
  const willLoseSeat =
    config.mode === 'edit' && Boolean(config.guest.tableId) && state.rsvp === 'declined';

  function update(patch: Partial<FormState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = state.name.trim();
    const email = state.email.trim();
    const nextNameError = name ? undefined : 'Please enter a name.';
    const nextEmailError =
      email && !EMAIL_PATTERN.test(email) ? 'That email address looks incomplete.' : undefined;
    setNameError(nextNameError);
    setEmailError(nextEmailError);
    const nextEventError =
      events.length > 0 && state.eventIds.length === 0 ? 'Choose at least one event.' : undefined;
    setEventError(nextEventError);
    if (nextNameError || nextEmailError || nextEventError) return;

    const input: Omit<GuestInput, 'tableId'> = {
      name,
      side: state.side,
      group: state.group.trim() || undefined,
      rsvp: state.rsvp,
      plusOne: state.plusOne,
      mealChoice: state.mealChoice.trim() || undefined,
      dietary: state.dietary.trim() || undefined,
      phone: state.phone.trim() || undefined,
      email: email || undefined,
      // Invited to every event is stored as "no list", so new events include them too.
      eventIds:
        events.length === 0 || state.eventIds.length === events.length ? undefined : state.eventIds,
    };

    setIsSaving(true);
    try {
      if (config.mode === 'edit') await updateGuest(config.guest.id, input);
      else await addGuest({ ...input, tableId: null });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (config.mode !== 'edit') return;
    setIsSaving(true);
    try {
      await deleteGuest(config.guest.id);
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
        title="Remove this guest?"
        description={`${state.name} will be removed from your guest list and seating chart.`}
      >
        <div className={form.actions}>
          <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
            Keep guest
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 aria-hidden />}
            onClick={() => void handleDelete()}
            disabled={isSaving}
          >
            Remove guest
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={isEdit ? 'Edit guest' : 'Add a guest'}>
      <form className={form.form} onSubmit={(e) => void handleSubmit(e)} noValidate>
        <TextField
          label="Name"
          placeholder="e.g. Nimali Perera"
          autoComplete="off"
          value={state.name}
          maxLength={100}
          error={nameError}
          hint={duplicate ? 'Someone with this name is already on your list.' : undefined}
          onChange={(e) => {
            update({ name: e.target.value });
            setNameError(undefined);
          }}
          autoFocus={!isEdit}
        />

        <SegmentedControl
          label="Whose guest?"
          showLabel
          options={sideOptions(partners)}
          value={state.side}
          onChange={(side) => update({ side })}
        />

        <SegmentedControl
          label="RSVP"
          showLabel
          options={RSVP_OPTIONS}
          value={state.rsvp}
          onChange={(rsvp) => update({ rsvp })}
        />
        {willLoseSeat && (
          <p className={form.hint}>They'll be removed from their table in the seating chart.</p>
        )}

        {events.length > 0 && (
          <EventInviteField
            events={events}
            selected={state.eventIds}
            onChange={(eventIds) => {
              update({ eventIds });
              setEventError(undefined);
            }}
            error={eventError}
          />
        )}

        <ToggleField
          label="Bringing a plus-one"
          description="Counts as an extra person in your headcount."
          checked={state.plusOne}
          onChange={(e) => update({ plusOne: e.target.checked })}
        />

        <div className={form.row}>
          <TextField
            label="Group (optional)"
            placeholder="Family, Friends, Work…"
            list={groupListId}
            value={state.group}
            maxLength={60}
            onChange={(e) => update({ group: e.target.value })}
          />
          <TextField
            label="Meal choice (optional)"
            placeholder="e.g. Chicken, Fish, Veg"
            list={mealListId}
            value={state.mealChoice}
            maxLength={60}
            onChange={(e) => update({ mealChoice: e.target.value })}
          />
        </div>
        <datalist id={groupListId}>
          {groupSuggestions.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <datalist id={mealListId}>
          {mealSuggestions.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>

        <TextField
          label="Dietary needs (optional)"
          placeholder="e.g. Vegetarian, nut allergy"
          value={state.dietary}
          maxLength={200}
          onChange={(e) => update({ dietary: e.target.value })}
        />

        <div className={form.row}>
          <TextField
            type="tel"
            label="Phone (optional)"
            autoComplete="off"
            value={state.phone}
            maxLength={40}
            onChange={(e) => update({ phone: e.target.value })}
          />
          <TextField
            type="email"
            label="Email (optional)"
            autoComplete="off"
            value={state.email}
            maxLength={120}
            error={emailError}
            onChange={(e) => {
              update({ email: e.target.value });
              setEmailError(undefined);
            }}
          />
        </div>

        <div className={form.actions}>
          {isEdit && (
            <Button
              variant="ghost"
              icon={<Trash2 aria-hidden />}
              onClick={() => setConfirmingDelete(true)}
              className={form.delete}
            >
              Remove
            </Button>
          )}
          <Button type="submit" disabled={isSaving}>
            {isEdit ? 'Save changes' : 'Add guest'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
