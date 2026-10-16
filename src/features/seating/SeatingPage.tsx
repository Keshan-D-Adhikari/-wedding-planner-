import { useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  pointerWithin,
  rectIntersection,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { Armchair, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Toast } from '@/components/Toast';
import { db } from '@/db/db';
import { seatGuest, seatsFor, updateTable } from '@/db/seating';
import { useToast } from '@/hooks/useToast';
import type { Guest, SeatingTable } from '@/types';
import { ChipView } from './GuestChip';
import { SeatingCanvas } from './SeatingCanvas';
import styles from './SeatingPage.module.css';
import {
  asDragData,
  asDropData,
  clampPosition,
  occupancyByTable,
  tableSize,
  unseatedGuests,
  type DragData,
} from './seatingUtils';
import { TableDetails } from './TableDetails';
import { TableFormDialog, type TableDialogConfig } from './TableFormDialog';
import { UnseatedPanel } from './UnseatedPanel';

/** Prefer "what's under the finger/cursor"; fall back to overlap for edge cases. */
const collisionDetection: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : rectIntersection(args);
};

/** A click that fires right after a drag ends shouldn't also count as a tap. */
const CLICK_AFTER_DRAG_MS = 250;

export default function SeatingPage() {
  const tables = useLiveQuery(() => db.seatingTables.toArray());
  const guests = useLiveQuery(() => db.guests.toArray());
  const toast = useToast();

  const [includePending, setIncludePending] = useState(false);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<TableDialogConfig>({ mode: 'add' });
  const [dialogKey, setDialogKey] = useState(0);

  const scaleRef = useRef(1);
  const lastDragEnd = useRef(0);
  const handleScaleChange = useCallback((scale: number) => {
    scaleRef.current = scale;
  }, []);

  // Small movement threshold so taps stay taps; a short press-and-hold on touch
  // starts a drag, so normal swipes can still scroll the page.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
  );

  const occupancy = useMemo(() => occupancyByTable(tables ?? [], guests ?? []), [tables, guests]);
  const unseated = useMemo(
    () => unseatedGuests(guests ?? [], includePending),
    [guests, includePending],
  );

  if (!tables || !guests) return <PageLoader />;

  const guestById = new Map(guests.map((g) => [g.id, g]));
  const selectedGuest = selectedGuestId ? guestById.get(selectedGuestId) : undefined;
  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const draggedGuest = activeDrag?.type === 'guest' ? guestById.get(activeDrag.guestId) : undefined;
  const placingGuest = draggedGuest ?? selectedGuest;
  const pendingSeats = placingGuest ? seatsFor(placingGuest) : null;

  const seatable = guests.filter(
    (g) => g.rsvp === 'attending' || (includePending && g.rsvp === 'pending'),
  );
  const attending = guests.filter((g) => g.rsvp === 'attending');
  const seatedAttending = attending.filter((g) => g.tableId).length;
  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
  const usedSeats = [...occupancy.values()].reduce((sum, o) => sum + o.used, 0);

  const justDragged = () => Date.now() - lastDragEnd.current < CLICK_AFTER_DRAG_MS;

  /** Seats (or unseats) a guest and reports the outcome. Returns true on success. */
  async function place(guest: Guest, table: SeatingTable | null): Promise<boolean> {
    const result = await seatGuest(guest.id, table?.id ?? null);
    if (result.ok) {
      if (table) toast.show(`${guest.name} is seated at ${table.name}.`);
      else toast.show(`${guest.name} moved to Unseated.`);
      return true;
    }
    if (result.reason === 'full') {
      const free = Math.max(0, result.free);
      toast.show(
        `${result.tableName} has ${free === 0 ? 'no' : `only ${free}`} free ${free === 1 ? 'seat' : 'seats'} — ${guest.name} needs ${result.needed}. Choose another table or add seats.`,
        'error',
      );
    }
    return false;
  }

  /* ---------- Tap-to-seat ---------- */

  function handleSelectGuest(guest: Guest) {
    if (justDragged()) return;
    setSelectedGuestId((current) => (current === guest.id ? null : guest.id));
  }

  function handleActivateTable(table: SeatingTable) {
    if (justDragged()) return;
    if (selectedGuest) {
      // Keep the guest selected if the table was full, so they can tap another one.
      void place(selectedGuest, table).then((ok) => {
        if (ok) setSelectedGuestId(null);
      });
      return;
    }
    setSelectedTableId((current) => (current === table.id ? null : table.id));
  }

  function handleNudge(table: SeatingTable, dx: number, dy: number) {
    const pos = clampPosition(table.x + dx, table.y + dy, tableSize(table.shape, table.capacity));
    void updateTable(table.id, pos);
  }

  /* ---------- Drag & drop ---------- */

  function handleDragStart(event: DragStartEvent) {
    const data = asDragData(event.active.data.current);
    setActiveDrag(data);
    if (data?.type === 'guest') setSelectedGuestId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    lastDragEnd.current = Date.now();
    setActiveDrag(null);
    const data = asDragData(event.active.data.current);
    if (!data) return;

    if (data.type === 'table') {
      const table = tables?.find((t) => t.id === data.tableId);
      if (!table) return;
      const scale = scaleRef.current;
      handleNudge(table, event.delta.x / scale, event.delta.y / scale);
      return;
    }

    const guest = guestById.get(data.guestId);
    const drop = asDropData(event.over?.data.current);
    if (!guest || !drop) return;
    if (drop.type === 'unseated') {
      if (guest.tableId) void place(guest, null);
    } else {
      const table = tables?.find((t) => t.id === drop.tableId);
      if (table) void place(guest, table);
    }
  }

  /* ---------- Dialog ---------- */

  function openDialog(config: TableDialogConfig) {
    setDialogConfig(config);
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  }

  const addButton = (
    <Button icon={<Plus aria-hidden />} onClick={() => openDialog({ mode: 'add' })}>
      Add tables
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Seating chart"
        subtitle="Arrange tables and seat your guests."
        actions={addButton}
      />

      {tables.length === 0 ? (
        <EmptyState
          icon={<Armchair aria-hidden />}
          title="Set up your room"
          message="Add your tables first — you can add several at once and drag them into place."
          action={addButton}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetection}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          <p className={styles.summary} role="status">
            <strong>
              {seatedAttending} of {attending.length}
            </strong>{' '}
            attending guests seated · {tables.length} {tables.length === 1 ? 'table' : 'tables'} ·{' '}
            {Math.max(0, totalSeats - usedSeats)} seats free
          </p>

          {selectedGuest && (
            <div className={styles.banner} role="status">
              <span>
                Tap a table for <strong>{selectedGuest.name}</strong>
                {selectedGuest.plusOne && ' (needs 2 seats)'}
              </span>
              <span className={styles.bannerActions}>
                {selectedGuest.tableId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      void place(selectedGuest, null);
                      setSelectedGuestId(null);
                    }}
                  >
                    Unseat
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setSelectedGuestId(null)}>
                  Cancel
                </Button>
              </span>
            </div>
          )}

          <div className={styles.layout}>
            <div className={styles.main}>
              <SeatingCanvas
                tables={tables}
                occupancy={occupancy}
                selectedTableId={selectedTableId}
                pendingSeats={pendingSeats}
                onActivateTable={handleActivateTable}
                onNudgeTable={handleNudge}
                onBackgroundClick={() => {
                  setSelectedTableId(null);
                  setSelectedGuestId(null);
                }}
                onScaleChange={handleScaleChange}
              />
              <p className={styles.tip}>
                Tip: drag tables to arrange your room. Focus a table and use the arrow keys to nudge
                it.
              </p>
              {selectedTable && (
                <TableDetails
                  table={selectedTable}
                  occupancy={
                    occupancy.get(selectedTable.id) ?? {
                      guests: [],
                      used: 0,
                      free: selectedTable.capacity,
                    }
                  }
                  selectedGuestId={selectedGuestId}
                  onSelectGuest={handleSelectGuest}
                  onUnseat={(guest) => void place(guest, null)}
                  onEdit={(table) =>
                    openDialog({
                      mode: 'edit',
                      table,
                      used: occupancy.get(table.id)?.used ?? 0,
                    })
                  }
                  onClose={() => setSelectedTableId(null)}
                />
              )}
            </div>

            <UnseatedPanel
              guests={unseated}
              totalSeatable={seatable.length}
              includePending={includePending}
              onIncludePendingChange={setIncludePending}
              selectedGuestId={selectedGuestId}
              onSelectGuest={handleSelectGuest}
              acceptingDrop={Boolean(draggedGuest?.tableId)}
            />
          </div>

          {/* The floating chip that follows the cursor/finger while dragging a guest */}
          <DragOverlay dropAnimation={null}>
            {draggedGuest ? <ChipView guest={draggedGuest} overlay /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <TableFormDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={dialogConfig}
        tables={tables}
        onSaved={(message) => toast.show(message)}
      />
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </>
  );
}
