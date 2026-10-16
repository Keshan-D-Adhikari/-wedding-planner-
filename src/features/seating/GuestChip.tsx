import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import type { Guest } from '@/types';
import { cx } from '@/utils/classNames';
import styles from './GuestChip.module.css';

interface ChipViewProps {
  guest: Guest;
  selected?: boolean;
  overlay?: boolean;
}

/** The visual part, shared by the real chip and the floating drag preview. */
export function ChipView({ guest, selected = false, overlay = false }: ChipViewProps) {
  return (
    <span className={cx(styles.chip, selected && styles.selected, overlay && styles.overlay)}>
      <GripVertical aria-hidden size={14} className={styles.grip} />
      <span className={styles.name}>{guest.name}</span>
      {guest.plusOne && <span className={styles.plusOne}>+1</span>}
      {guest.rsvp === 'pending' && <span className={styles.pending}>pending</span>}
    </span>
  );
}

interface GuestChipProps {
  guest: Guest;
  selected: boolean;
  onSelect: (guest: Guest) => void;
}

/** Drag it onto a table — or tap it, then tap a table. */
export function GuestChip({ guest, selected, onSelect }: GuestChipProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `guest:${guest.id}`,
    data: { type: 'guest', guestId: guest.id },
  });

  const seats = guest.plusOne ? '2 seats' : '1 seat';

  return (
    <button
      type="button"
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cx(styles.button, isDragging && styles.dragging)}
      aria-pressed={selected}
      onClick={() => onSelect(guest)}
    >
      <ChipView guest={guest} selected={selected} />
      {/* Visible name stays the accessible name; these details are for screen readers. */}
      <span className="visually-hidden">
        , needs {seats}
        {selected ? ', selected — now choose a table' : ''}
      </span>
    </button>
  );
}
