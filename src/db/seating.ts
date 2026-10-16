import type { Guest, SeatingTable } from '@/types';
import { createId } from '@/utils/id';
import { db } from './db';

export type TableInput = Omit<SeatingTable, 'id'>;

/** A guest bringing a plus-one needs two seats. */
export function seatsFor(guest: Pick<Guest, 'plusOne'>): number {
  return guest.plusOne ? 2 : 1;
}

export async function addTables(inputs: TableInput[]): Promise<string[]> {
  const tables = inputs.map((input) => ({ ...input, id: createId() }));
  await db.seatingTables.bulkAdd(tables);
  return tables.map((t) => t.id);
}

export async function updateTable(id: string, changes: Partial<TableInput>): Promise<void> {
  await db.seatingTables.update(id, changes);
}

/** Deletes a table and moves everyone sitting at it back to "Unseated". */
export async function deleteTable(id: string): Promise<void> {
  await db.transaction('rw', db.seatingTables, db.guests, async () => {
    await db.guests.where('tableId').equals(id).modify({ tableId: null });
    await db.seatingTables.delete(id);
  });
}

export type SeatResult =
  | { ok: true }
  | { ok: false; reason: 'full'; tableName: string; free: number; needed: number }
  | { ok: false; reason: 'missing' };

/**
 * Seats a guest at a table (or unseats them with `null`).
 * The capacity check runs inside a transaction, so two quick drops can't
 * overfill a table between "check" and "save".
 */
export async function seatGuest(guestId: string, tableId: string | null): Promise<SeatResult> {
  return db.transaction('rw', db.seatingTables, db.guests, async (): Promise<SeatResult> => {
    const guest = await db.guests.get(guestId);
    if (!guest) return { ok: false, reason: 'missing' };

    if (tableId === null) {
      await db.guests.update(guestId, { tableId: null });
      return { ok: true };
    }
    if (guest.tableId === tableId) return { ok: true };

    const table = await db.seatingTables.get(tableId);
    if (!table) return { ok: false, reason: 'missing' };

    const seated = await db.guests.where('tableId').equals(tableId).toArray();
    const used = seated.reduce((sum, g) => sum + seatsFor(g), 0);
    const needed = seatsFor(guest);
    const free = table.capacity - used;
    if (needed > free) return { ok: false, reason: 'full', tableName: table.name, free, needed };

    await db.guests.update(guestId, { tableId });
    return { ok: true };
  });
}
