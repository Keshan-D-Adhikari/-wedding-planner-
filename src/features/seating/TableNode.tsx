import type { CSSProperties, KeyboardEvent } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { SeatingTable } from '@/types';
import { cx } from '@/utils/classNames';
import { NUDGE_STEP, seatPositions, tableSize, type TableOccupancy } from './seatingUtils';
import styles from './TableNode.module.css';

interface TableNodeProps {
  table: SeatingTable;
  occupancy: TableOccupancy;
  scale: number;
  selected: boolean;
  /** Seats needed by the guest being placed (tap or drag), or null */
  pendingSeats: number | null;
  onActivate: (table: SeatingTable) => void;
  onNudge: (table: SeatingTable, dx: number, dy: number) => void;
}

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/** One table on the floor plan: drag to move it, drop guests on it, tap to select. */
export function TableNode({
  table,
  occupancy,
  scale,
  selected,
  pendingSeats,
  onActivate,
  onNudge,
}: TableNodeProps) {
  const drag = useDraggable({
    id: `table:${table.id}`,
    data: { type: 'table', tableId: table.id },
  });
  const drop = useDroppable({ id: `drop:${table.id}`, data: { type: 'table', tableId: table.id } });

  const size = tableSize(table.shape, table.capacity);
  const placing = pendingSeats !== null;
  const fits = placing && occupancy.free >= pendingSeats;
  const full = occupancy.free <= 0;

  // dnd-kit reports movement in screen pixels; the room is scaled, so convert back.
  const transform = drag.transform
    ? `translate3d(${drag.transform.x / scale}px, ${drag.transform.y / scale}px, 0)`
    : undefined;

  const style: CSSProperties = {
    left: table.x,
    top: table.y,
    width: size.width,
    height: size.height,
    transform,
  };

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const direction = ARROWS[event.key];
    if (!direction) return;
    event.preventDefault();
    const step = event.shiftKey ? NUDGE_STEP * 3 : NUDGE_STEP;
    onNudge(table, direction[0] * step, direction[1] * step);
  }

  // Extra details for screen readers. The visible name stays part of the
  // accessible name (no aria-label), so voice control ("click Table 3") works.
  const details = [
    `${table.shape === 'round' ? 'round' : 'long'} table`,
    `${occupancy.used} of ${table.capacity} seats taken`,
    placing ? (fits ? 'press to seat the selected guest here' : 'not enough free seats') : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <button
      type="button"
      ref={(node) => {
        drag.setNodeRef(node);
        drop.setNodeRef(node);
      }}
      {...drag.attributes}
      {...drag.listeners}
      aria-pressed={selected}
      className={cx(
        styles.table,
        styles[table.shape],
        selected && styles.selected,
        drag.isDragging && styles.dragging,
        placing && fits && styles.canDrop,
        placing && !fits && styles.cannotDrop,
        drop.isOver && placing && (fits ? styles.over : styles.overFull),
      )}
      style={style}
      onClick={() => onActivate(table)}
      onKeyDown={handleKeyDown}
    >
      <span className={styles.seats} aria-hidden>
        {seatPositions(table.shape, table.capacity).map((pos, i) => (
          <span
            key={i}
            className={cx(styles.seat, i < occupancy.used && styles.seatTaken)}
            style={{ left: `${pos.left}%`, top: `${pos.top}%` }}
          />
        ))}
      </span>
      <span className={styles.name}>{table.name}</span>
      <span className={cx(styles.count, full && styles.countFull)} aria-hidden>
        {occupancy.used}/{table.capacity}
      </span>
      <span className="visually-hidden">, {details}</span>
    </button>
  );
}
