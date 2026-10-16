import Dexie, { type EntityTable } from 'dexie';
import type { AppMeta, BudgetItem, ChecklistTask, Guest, SeatingTable, Wedding } from '@/types';

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
  }
}

export const db = new WeddingDatabase();
