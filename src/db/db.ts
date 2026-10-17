import Dexie, { type EntityTable, type Table } from 'dexie';
import type {
  AppMeta,
  BudgetItem,
  ChecklistTask,
  Guest,
  SeatingTable,
  Timestamped,
  Wedding,
  WeddingEvent,
} from '@/types';

export const DB_NAME = 'wedding-planner';

/**
 * The whole app's data lives in this IndexedDB database, on the user's device.
 *
 * Schema notes:
 * - The first key in each store string is the primary key.
 * - Only list fields we actually query/sort by. Booleans and null cannot be
 *   indexed in IndexedDB, so `completed` and `tableId: null` are filtered in memory.
 * - Note: the seating store is called `seatingTables` because `db.tables` is a built-in Dexie property.
 * - To change the schema later, ADD `this.version(2).stores({...})` — never edit version 1.
 */
export class WeddingDatabase extends Dexie {
  wedding!: EntityTable<Wedding, 'id'>;
  tasks!: EntityTable<ChecklistTask, 'id'>;
  budgetItems!: EntityTable<BudgetItem, 'id'>;
  guests!: EntityTable<Guest, 'id'>;
  seatingTables!: EntityTable<SeatingTable, 'id'>;
  events!: EntityTable<WeddingEvent, 'id'>;
  meta!: EntityTable<AppMeta, 'key'>;

  constructor() {
    super(DB_NAME);

    this.version(1).stores({
      wedding: 'id',
      tasks: 'id, timeframe, category, order, dueDate',
      budgetItems: 'id, category',
      guests: 'id, name, side, rsvp, group, tableId',
      seatingTables: 'id',
      meta: 'key',
    });

    // v2: events (Poruwa, Homecoming, Mehendi…). Existing data is untouched.
    this.version(2).stores({
      events: 'id, order',
    });
  }
}

export const db = new WeddingDatabase();

/* ---------- Automatic "last changed" timestamps ----------
 * Every add/update stamps `updatedAt`, so partner plans can be merged later
 * (newest change wins) without each save function having to remember it.
 * While a merge or restore is copying records in, keep their original times.
 */
let keepIncomingTimestamps = false;

/** Runs `work` without overwriting `updatedAt` on the records it writes. */
export async function withOriginalTimestamps<T>(work: () => Promise<T>): Promise<T> {
  keepIncomingTimestamps = true;
  try {
    return await work();
  } finally {
    keepIncomingTimestamps = false;
  }
}

function stampChanges(table: Table<Timestamped, string>) {
  table.hook('creating', (_key, record) => {
    if (!keepIncomingTimestamps || record.updatedAt === undefined) record.updatedAt = Date.now();
  });
  table.hook('updating', (changes) => {
    if (keepIncomingTimestamps && 'updatedAt' in changes) return undefined;
    return { updatedAt: Date.now() };
  });
}

for (const table of [
  db.wedding,
  db.tasks,
  db.budgetItems,
  db.guests,
  db.seatingTables,
  db.events,
]) {
  stampChanges(table);
}
