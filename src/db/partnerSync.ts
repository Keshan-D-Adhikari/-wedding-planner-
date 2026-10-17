import type { Table } from 'dexie';
import type { Timestamped } from '@/types';
import type { BackupData, BackupFile } from './backup';
import { db, withOriginalTimestamps } from './db';

/** The tables shared between partners (app metadata like backup dates stays per-device). */
type SyncedKey = Exclude<keyof BackupData, 'meta'>;
const SYNCED: readonly SyncedKey[] = ['wedding', 'tasks', 'budgetItems', 'guests', 'seatingTables'];

/** [one, many] names for each kind of record, for messages like "1 new guest". */
export const SYNC_LABELS: Record<SyncedKey, [string, string]> = {
  wedding: ['wedding detail', 'wedding details'],
  tasks: ['task', 'tasks'],
  budgetItems: ['budget item', 'budget items'],
  guests: ['guest', 'guests'],
  seatingTables: ['table', 'tables'],
};

export type MergeCounts = Record<SyncedKey, { added: number; updated: number }>;

export type MergePlan =
  /** Nothing here yet — the partner's plan can simply be copied in. */
  | { kind: 'fresh' }
  /** Same wedding on both devices — records can be merged one by one. */
  | { kind: 'merge'; counts: MergeCounts; changes: number }
  /** Each partner started their own planner — merging would duplicate everything. */
  | { kind: 'different'; localCouple: string; incomingCouple: string };

interface Row extends Timestamped {
  id: string;
}

function tableFor(key: SyncedKey): Table<Row, string> {
  return db[key] as unknown as Table<Row, string>;
}

/**
 * Compares a record from each side. The newer `updatedAt` wins; records with no
 * time (made before timestamps existed) count as the oldest.
 */
function isNewer(incoming: Row, local: Row): boolean {
  return (incoming.updatedAt ?? 0) > (local.updatedAt ?? 0);
}

/** Works out what importing the partner's file would do, without changing anything. */
export async function planMerge(incoming: BackupFile): Promise<MergePlan> {
  const local = await db.wedding.toCollection().first();
  const theirs = incoming.data.wedding[0];
  if (!local) return { kind: 'fresh' };
  if (!theirs || theirs.id !== local.id) {
    return {
      kind: 'different',
      localCouple: `${local.partner1Name} & ${local.partner2Name}`,
      incomingCouple: theirs ? `${theirs.partner1Name} & ${theirs.partner2Name}` : 'unknown',
    };
  }

  const counts = {} as MergeCounts;
  let changes = 0;
  for (const key of SYNCED) {
    const existing = new Map((await tableFor(key).toArray()).map((r) => [r.id, r]));
    let added = 0;
    let updated = 0;
    for (const record of incoming.data[key] as Row[]) {
      const mine = existing.get(record.id);
      if (!mine) added++;
      else if (isNewer(record, mine)) updated++;
    }
    counts[key] = { added, updated };
    changes += added + updated;
  }
  return { kind: 'merge', counts, changes };
}

/**
 * Merges the partner's plan into this device in one all-or-nothing transaction.
 * New records are added and newer versions replace older ones. Deletions are not
 * shared: something deleted here comes back if the partner still has it.
 */
export async function mergePartnerPlan(incoming: BackupFile): Promise<number> {
  return withOriginalTimestamps(() =>
    db.transaction('rw', SYNCED.map(tableFor), async () => {
      let written = 0;
      for (const key of SYNCED) {
        const table = tableFor(key);
        const existing = new Map((await table.toArray()).map((r) => [r.id, r]));
        const toWrite = (incoming.data[key] as Row[]).filter((record) => {
          const mine = existing.get(record.id);
          return !mine || isNewer(record, mine);
        });
        if (toWrite.length > 0) await table.bulkPut(toWrite);
        written += toWrite.length;
      }
      return written;
    }),
  );
}
