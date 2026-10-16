import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { PartyPopper, UserRound } from 'lucide-react';
import { LinkButton } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ToggleField } from '@/components/ToggleField';
import type { Guest } from '@/types';
import { cx } from '@/utils/classNames';
import { GuestChip } from './GuestChip';
import styles from './UnseatedPanel.module.css';

interface UnseatedPanelProps {
  guests: Guest[];
  totalSeatable: number;
  includePending: boolean;
  onIncludePendingChange: (value: boolean) => void;
  selectedGuestId: string | null;
  onSelectGuest: (guest: Guest) => void;
  /** True while a seated guest is being dragged (so this panel shows it can take them back) */
  acceptingDrop: boolean;
}

export function UnseatedPanel({
  guests,
  totalSeatable,
  includePending,
  onIncludePendingChange,
  selectedGuestId,
  onSelectGuest,
  acceptingDrop,
}: UnseatedPanelProps) {
  const [query, setQuery] = useState('');
  const { setNodeRef, isOver } = useDroppable({ id: 'unseated', data: { type: 'unseated' } });

  const q = query.trim().toLowerCase();
  const visible = q ? guests.filter((g) => g.name.toLowerCase().includes(q)) : guests;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby="unseated-heading"
      className={cx(styles.panel, acceptingDrop && styles.accepting, isOver && styles.over)}
    >
      <header className={styles.header}>
        <h2 id="unseated-heading" className={styles.title}>
          Unseated <span className={styles.count}>{guests.length}</span>
        </h2>
        <p className={styles.help}>Drag a guest onto a table — or tap a guest, then tap a table.</p>
      </header>

      <ToggleField
        label="Include pending RSVPs"
        description="Declined guests are never shown."
        checked={includePending}
        onChange={(e) => onIncludePendingChange(e.target.checked)}
      />

      {guests.length > 8 && (
        <TextField
          type="search"
          label="Find a guest"
          hideLabel
          placeholder="Find a guest…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      )}

      {acceptingDrop && <p className={styles.dropHint}>Drop here to unseat</p>}

      {totalSeatable === 0 ? (
        <div className={styles.empty}>
          <UserRound aria-hidden size={24} />
          <p>No {includePending ? '' : 'attending '}guests yet.</p>
          <LinkButton to="/guests" variant="secondary" size="sm">
            Go to guest list
          </LinkButton>
        </div>
      ) : guests.length === 0 ? (
        <div className={styles.empty}>
          <PartyPopper aria-hidden size={24} />
          <p>Everyone has a seat!</p>
        </div>
      ) : (
        <ul role="list" className={styles.list}>
          {visible.map((guest) => (
            <li key={guest.id}>
              <GuestChip
                guest={guest}
                selected={guest.id === selectedGuestId}
                onSelect={onSelectGuest}
              />
            </li>
          ))}
          {visible.length === 0 && <li className={styles.noMatch}>No one matches “{query}”.</li>}
        </ul>
      )}
    </section>
  );
}
