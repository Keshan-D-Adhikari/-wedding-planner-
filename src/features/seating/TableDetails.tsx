import { Pencil, X } from 'lucide-react';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import type { Guest, SeatingTable } from '@/types';
import { GuestChip } from './GuestChip';
import type { TableOccupancy } from './seatingUtils';
import styles from './TableDetails.module.css';

interface TableDetailsProps {
  table: SeatingTable;
  occupancy: TableOccupancy;
  selectedGuestId: string | null;
  onSelectGuest: (guest: Guest) => void;
  onUnseat: (guest: Guest) => void;
  onEdit: (table: SeatingTable) => void;
  onClose: () => void;
}

/** Who's sitting at the selected table, with quick ways to move or remove them. */
export function TableDetails({
  table,
  occupancy,
  selectedGuestId,
  onSelectGuest,
  onUnseat,
  onEdit,
  onClose,
}: TableDetailsProps) {
  const { used, guests } = occupancy;
  const full = used >= table.capacity;

  return (
    <section className={styles.panel} aria-labelledby="table-details-heading">
      <header className={styles.header}>
        <div>
          <h2 id="table-details-heading" className={styles.title}>
            {table.name}
          </h2>
          <p className={styles.meta}>
            {table.shape === 'round' ? 'Round' : 'Long'} table · {used} of {table.capacity} seats
            taken{full && ' · full'}
          </p>
        </div>
        <button
          type="button"
          className={styles.close}
          onClick={onClose}
          aria-label="Close table details"
        >
          <X aria-hidden size={18} />
        </button>
      </header>

      <ProgressBar
        value={(used / table.capacity) * 100}
        label={`${table.name} seats taken`}
        tone={full ? 'success' : 'primary'}
      />

      {guests.length === 0 ? (
        <p className={styles.empty}>No one here yet. Drag guests onto this table.</p>
      ) : (
        <ul role="list" className={styles.list}>
          {guests.map((guest) => (
            <li key={guest.id} className={styles.row}>
              <GuestChip
                guest={guest}
                selected={guest.id === selectedGuestId}
                onSelect={onSelectGuest}
              />
              <button
                type="button"
                className={styles.remove}
                onClick={() => onUnseat(guest)}
                aria-label={`Remove ${guest.name} from ${table.name}`}
              >
                <X aria-hidden size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        variant="secondary"
        size="sm"
        icon={<Pencil aria-hidden />}
        onClick={() => onEdit(table)}
        className={styles.edit}
      >
        Edit table
      </Button>
    </section>
  );
}
