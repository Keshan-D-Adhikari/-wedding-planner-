import { useMemo, useState } from 'react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { TextAreaField } from '@/components/TextAreaField';
import { applyRsvpUpdates, type RsvpUpdate } from '@/db/guests';
import type { Guest, RsvpStatus } from '@/types';
import { isOneOf } from '@/utils/guards';
import { normalizeName, RSVP_LABELS, RSVP_VALUES } from './guestUtils';
import styles from './PasteRepliesDialog.module.css';
import { intentToRsvp, parseReplies, type Reply } from './replyParser';

const MAX_PASTE_LENGTH = 200_000;

interface Override {
  guestId?: string;
  /** '' means "I haven't chosen yet" */
  rsvp?: RsvpStatus | '';
  skip?: boolean;
}

interface Row {
  key: string;
  reply: Reply;
  guest: Guest | null;
  rsvp: RsvpStatus | null;
  plusOne: boolean;
  skipped: boolean;
  /** True when applying this row would actually change something */
  changes: boolean;
}

interface PasteRepliesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guests: Guest[];
  onApplied: (message: string) => void;
}

/**
 * Paste WhatsApp replies (an exported chat, or lines like "Nimali: yes") and see the
 * RSVP changes they imply. Nothing is saved until "Update RSVPs" is pressed.
 */
export function PasteRepliesDialog({
  open,
  onOpenChange,
  guests,
  onApplied,
}: PasteRepliesDialogProps) {
  const [text, setText] = useState('');
  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [busy, setBusy] = useState(false);

  const sortedGuests = useMemo(
    () => [...guests].sort((a, b) => a.name.localeCompare(b.name)),
    [guests],
  );
  const guestById = useMemo(() => new Map(guests.map((g) => [g.id, g])), [guests]);

  const { rows, ignored } = useMemo(() => {
    const replies = parseReplies(text.slice(0, MAX_PASTE_LENGTH), guests);
    const result: Row[] = [];
    let ignoredCount = 0;

    for (const reply of replies) {
      // Unmatched chatter with no clear answer (e.g. your own invite) isn't worth showing.
      if (!reply.guest && reply.intent === 'unclear') {
        ignoredCount++;
        continue;
      }
      const key = normalizeName(reply.sender);
      const override = overrides[key] ?? {};
      const guest = override.guestId ? (guestById.get(override.guestId) ?? null) : reply.guest;
      const chosen = override.rsvp !== undefined ? override.rsvp : intentToRsvp(reply.intent);
      const rsvp = chosen === '' ? null : chosen;
      const skipped = Boolean(override.skip);
      const changes =
        guest !== null &&
        rsvp !== null &&
        (rsvp !== guest.rsvp || (reply.plusOne && !guest.plusOne));
      result.push({ key, reply, guest, rsvp, plusOne: reply.plusOne, skipped, changes });
    }
    return { rows: result, ignored: ignoredCount };
  }, [text, guests, guestById, overrides]);

  const toApply = rows.filter((r) => r.changes && !r.skipped);

  function setOverride(key: string, patch: Override) {
    setOverrides((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleApply() {
    const updates: RsvpUpdate[] = [];
    for (const row of toApply) {
      if (row.guest && row.rsvp) {
        updates.push({ id: row.guest.id, rsvp: row.rsvp, plusOne: row.plusOne });
      }
    }
    if (updates.length === 0) return;
    setBusy(true);
    try {
      await applyRsvpUpdates(updates);
      onOpenChange(false);
      onApplied(`${updates.length} ${updates.length === 1 ? 'RSVP' : 'RSVPs'} updated.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Paste RSVP replies"
      description="In WhatsApp, open a chat (or the group) → ⋮ → More → Export chat → Without media, then paste it here. Lines like “Nimali: yes” work too."
    >
      <div className={form.form}>
        <TextAreaField
          label="Replies"
          rows={6}
          placeholder={'Nimali Perera: Yes! See you there\nRuwan: Sorry, can’t make it'}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setOverrides({});
          }}
          autoFocus
        />

        {text.trim() !== '' && rows.length === 0 && (
          <p className={form.note} role="status">
            We couldn’t find any replies in that text. Each reply should look like “Name: message”.
          </p>
        )}

        {rows.length > 0 && (
          <>
            <p className={form.note} role="status">
              <strong>{toApply.length}</strong> {toApply.length === 1 ? 'change' : 'changes'} ready
              to apply
              {ignored > 0 &&
                ` · ${ignored} other ${ignored === 1 ? 'message' : 'messages'} ignored`}
            </p>
            <ul role="list" className={styles.list}>
              {rows.map((row) => (
                <li key={row.key} className={styles.row}>
                  <div className={styles.top}>
                    <span className={styles.sender}>{row.reply.sender}</span>
                    {row.guest && row.guest.name !== row.reply.sender && (
                      <span className={styles.matched}>→ {row.guest.name}</span>
                    )}
                  </div>
                  <p className={styles.message}>“{row.reply.message}”</p>

                  <div className={styles.controls}>
                    {!row.guest && (
                      <label className={styles.field}>
                        <span className={styles.problem}>
                          {row.reply.problem ?? 'No match'} — choose:
                        </span>
                        <select
                          className={styles.select}
                          value=""
                          onChange={(e) => setOverride(row.key, { guestId: e.target.value })}
                        >
                          <option value="">Choose guest…</option>
                          {sortedGuests.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {row.guest && (
                      <label className={styles.field}>
                        <span className="visually-hidden">RSVP for {row.guest.name}</span>
                        <select
                          className={styles.select}
                          value={row.rsvp ?? ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || isOneOf(RSVP_VALUES, value)) {
                              setOverride(row.key, { rsvp: value });
                            }
                          }}
                        >
                          <option value="">Choose answer…</option>
                          {RSVP_VALUES.map((value) => (
                            <option key={value} value={value}>
                              {RSVP_LABELS[value]}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}

                    {row.plusOne && <span className={styles.chip}>+1</span>}

                    {row.guest && row.rsvp && !row.changes && (
                      <span className={styles.nochange}>No change</span>
                    )}
                    {row.changes && (
                      <label className={styles.apply}>
                        <input
                          type="checkbox"
                          checked={!row.skipped}
                          onChange={(e) => setOverride(row.key, { skip: !e.target.checked })}
                        />
                        Apply
                      </label>
                    )}
                  </div>
                  {row.guest && (
                    <p className={styles.current}>Currently: {RSVP_LABELS[row.guest.rsvp]}</p>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}

        <div className={form.actions}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleApply()} disabled={busy || toApply.length === 0}>
            {toApply.length > 0
              ? `Update ${toApply.length} ${toApply.length === 1 ? 'RSVP' : 'RSVPs'}`
              : 'Update RSVPs'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
