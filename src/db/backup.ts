import {
  BUDGET_CATEGORIES,
  CURRENCY_CODES,
  TASK_CATEGORIES,
  THEME_NAMES,
  TIMEFRAMES,
  type AppMeta,
  type BudgetItem,
  type ChecklistTask,
  type Guest,
  type MetaKey,
  type SeatingTable,
  type Wedding,
} from '@/types';
import { db, withOriginalTimestamps } from './db';

export const BACKUP_APP_ID = 'wedding-planner';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export interface BackupData {
  wedding: Wedding[];
  tasks: ChecklistTask[];
  budgetItems: BudgetItem[];
  guests: Guest[];
  seatingTables: SeatingTable[];
  meta: AppMeta[];
}

export interface BackupFile {
  app: typeof BACKUP_APP_ID;
  version: number;
  exportedAt: string;
  data: BackupData;
}

/* ---------- Export ---------- */

export async function createBackup(): Promise<BackupFile> {
  const [wedding, tasks, budgetItems, guests, seatingTables, meta] = await Promise.all([
    db.wedding.toArray(),
    db.tasks.toArray(),
    db.budgetItems.toArray(),
    db.guests.toArray(),
    db.seatingTables.toArray(),
    db.meta.toArray(),
  ]);
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { wedding, tasks, budgetItems, guests, seatingTables, meta },
  };
}

export async function setMeta(key: MetaKey, value: string): Promise<void> {
  await db.meta.put({ key, value });
}

export async function getMeta(key: MetaKey): Promise<string | undefined> {
  return (await db.meta.get(key))?.value;
}

/* ---------- Validation ----------
 * A backup file comes from outside the app, so nothing in it is trusted.
 * Each record is rebuilt field by field: wrong types are rejected, unknown
 * fields are dropped, and text is length-limited.
 */

type Json = Record<string, unknown>;

class BackupError extends Error {}

const isObject = (v: unknown): v is Json =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

function str(v: unknown, field: string, max = 500): string {
  if (typeof v !== 'string' || v.trim() === '') throw new BackupError(`Missing ${field}`);
  return v.slice(0, max);
}
function optStr(v: unknown, max = 500): string | undefined {
  return typeof v === 'string' && v !== '' ? v.slice(0, max) : undefined;
}
function num(v: unknown, field: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new BackupError(`Invalid ${field}`);
  return v;
}
const amount = (v: unknown, field: string) => Math.max(0, num(v, field));
/** A valid "last changed" time, or undefined (older backups don't have one). */ const stamp = (
  v: unknown,
) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined);

function parseWedding(r: Json): Wedding {
  if (!oneOf(CURRENCY_CODES, r.currency)) throw new BackupError('Invalid currency');
  return {
    id: str(r.id, 'wedding id', 64),
    partner1Name: str(r.partner1Name, 'partner name', 100),
    partner2Name: str(r.partner2Name, 'partner name', 100),
    weddingDate: str(r.weddingDate, 'wedding date', 10),
    venue: optStr(r.venue, 200),
    totalBudget: amount(r.totalBudget, 'budget'),
    currency: r.currency,
    theme: oneOf(THEME_NAMES, r.theme) ? r.theme : 'blush',
    createdAt: optStr(r.createdAt, 40) ?? new Date().toISOString(),
    updatedAt: stamp(r.updatedAt),
  };
}

function parseTask(r: Json): ChecklistTask {
  return {
    id: str(r.id, 'task id', 64),
    title: str(r.title, 'task title', 200),
    notes: optStr(r.notes, 1000),
    category: oneOf(TASK_CATEGORIES, r.category) ? r.category : 'Other',
    timeframe: oneOf(TIMEFRAMES, r.timeframe) ? r.timeframe : '1 month',
    dueDate: optStr(r.dueDate, 10),
    completed: r.completed === true,
    isCustom: r.isCustom === true,
    order: typeof r.order === 'number' && Number.isFinite(r.order) ? r.order : 0,
    updatedAt: stamp(r.updatedAt),
  };
}

function parseBudgetItem(r: Json): BudgetItem {
  return {
    id: str(r.id, 'budget item id', 64),
    category: optStr(r.category, 60) ?? BUDGET_CATEGORIES[BUDGET_CATEGORIES.length - 1] ?? 'Other',
    name: str(r.name, 'budget item name', 200),
    estimated: amount(r.estimated, 'estimate'),
    actual: amount(r.actual, 'actual cost'),
    paid: amount(r.paid, 'paid amount'),
    vendorName: optStr(r.vendorName, 200),
    dueDate: optStr(r.dueDate, 10),
    notes: optStr(r.notes, 1000),
    updatedAt: stamp(r.updatedAt),
  };
}

function parseGuest(r: Json): Guest {
  return {
    id: str(r.id, 'guest id', 64),
    name: str(r.name, 'guest name', 200),
    side: oneOf(['partner1', 'partner2', 'both'] as const, r.side) ? r.side : 'both',
    group: optStr(r.group, 100),
    rsvp: oneOf(['pending', 'attending', 'declined'] as const, r.rsvp) ? r.rsvp : 'pending',
    plusOne: r.plusOne === true,
    mealChoice: optStr(r.mealChoice, 100),
    dietary: optStr(r.dietary, 300),
    phone: optStr(r.phone, 60),
    email: optStr(r.email, 200),
    tableId: optStr(r.tableId, 64) ?? null,
    updatedAt: stamp(r.updatedAt),
  };
}

function parseTable(r: Json): SeatingTable {
  return {
    id: str(r.id, 'table id', 64),
    name: str(r.name, 'table name', 100),
    shape: r.shape === 'rectangle' ? 'rectangle' : 'round',
    capacity: Math.min(30, Math.max(1, Math.round(num(r.capacity, 'table capacity')))),
    x: num(r.x, 'table position'),
    y: num(r.y, 'table position'),
    updatedAt: stamp(r.updatedAt),
  };
}

function parseMeta(r: Json): AppMeta | null {
  if (!oneOf(['lastBackupAt', 'backupReminderDismissedAt'] as const, r.key)) return null;
  return typeof r.value === 'string' ? { key: r.key, value: r.value.slice(0, 40) } : null;
}

function list<T>(value: unknown, parse: (r: Json) => T): T[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new BackupError('Unexpected file structure');
  return value.map((item) => {
    if (!isObject(item)) throw new BackupError('Unexpected record');
    return parse(item);
  });
}

export type BackupParseResult = { ok: true; backup: BackupFile } | { ok: false; message: string };

/** Parses and validates a backup file's text. Never throws. */
export function parseBackup(text: string): BackupParseResult {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, message: "This file isn't a valid backup (it couldn't be read)." };
  }

  if (!isObject(json) || json.app !== BACKUP_APP_ID || !isObject(json.data)) {
    return { ok: false, message: "This doesn't look like a backup from this planner." };
  }
  if (typeof json.version !== 'number' || json.version > BACKUP_VERSION) {
    return {
      ok: false,
      message:
        'This backup was made with a newer version of the planner. Please refresh the page and try again.',
    };
  }

  try {
    const d = json.data;
    const data: BackupData = {
      wedding: list(d.wedding, parseWedding),
      tasks: list(d.tasks, parseTask),
      budgetItems: list(d.budgetItems, parseBudgetItem),
      guests: list(d.guests, parseGuest),
      seatingTables: list(d.seatingTables, parseTable),
      meta: list(d.meta, parseMeta).filter((m): m is AppMeta => m !== null),
    };
    if (data.wedding.length !== 1) {
      return { ok: false, message: 'This backup has no wedding details in it.' };
    }
    // Drop seats that point at tables which aren't in the file.
    const tableIds = new Set(data.seatingTables.map((t) => t.id));
    data.guests = data.guests.map((g) =>
      g.tableId && !tableIds.has(g.tableId) ? { ...g, tableId: null } : g,
    );
    return {
      ok: true,
      backup: {
        app: BACKUP_APP_ID,
        version: json.version,
        exportedAt: optStr(json.exportedAt, 40) ?? '',
        data,
      },
    };
  } catch (error) {
    const detail = error instanceof BackupError ? ` (${error.message.toLowerCase()})` : '';
    return { ok: false, message: `This backup file is damaged and can't be restored${detail}.` };
  }
}

/** Replaces EVERYTHING in the planner with the backup, in one all-or-nothing transaction. */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { data } = backup;
  // Keep each record's original "last changed" time so later partner merges stay correct.
  await withOriginalTimestamps(() =>
    db.transaction(
      'rw',
      [db.wedding, db.tasks, db.budgetItems, db.guests, db.seatingTables, db.meta],
      async () => {
        await Promise.all([
          db.wedding.clear(),
          db.tasks.clear(),
          db.budgetItems.clear(),
          db.guests.clear(),
          db.seatingTables.clear(),
          db.meta.clear(),
        ]);
        await db.wedding.bulkAdd(data.wedding);
        await db.tasks.bulkAdd(data.tasks);
        await db.budgetItems.bulkAdd(data.budgetItems);
        await db.guests.bulkAdd(data.guests);
        await db.seatingTables.bulkAdd(data.seatingTables);
        await db.meta.bulkAdd(data.meta);
        // The data now matches the backup, so it counts as backed up.
        await db.meta.put({
          key: 'lastBackupAt',
          value: backup.exportedAt || new Date().toISOString(),
        });
      },
    ),
  );
}
