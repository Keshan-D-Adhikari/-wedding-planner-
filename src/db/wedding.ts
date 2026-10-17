import { addDays, differenceInCalendarDays, max, startOfToday } from 'date-fns';
import type { Wedding } from '@/types';
import { parseDate, toISODate } from '@/utils/date';
import { createId } from '@/utils/id';
import { db } from './db';
import { buildDefaultTasks } from './seed/defaultTasks';
import { requestPersistentStorage } from './storage';

export type NewWeddingInput = Omit<Wedding, 'id' | 'createdAt'>;

/**
 * Saves the wedding and its starter checklist in ONE transaction:
 * either both are written or neither is, so a crash can't leave half a setup.
 */
export async function createWedding(input: NewWeddingInput): Promise<Wedding> {
  const wedding: Wedding = {
    ...input,
    id: createId(),
    createdAt: new Date().toISOString(),
  };
  const tasks = buildDefaultTasks(wedding.weddingDate);

  await db.transaction('rw', db.wedding, db.tasks, async () => {
    await db.wedding.add(wedding);
    await db.tasks.bulkAdd(tasks);
  });

  // Ask the browser to keep our data safe from automatic clean-up. Not awaited:
  // some browsers show a prompt and we don't want to block the redirect.
  void requestPersistentStorage();

  return wedding;
}

export type WeddingChanges = Partial<Omit<Wedding, 'id' | 'createdAt'>>;

export async function updateWedding(id: string, changes: WeddingChanges): Promise<void> {
  await db.wedding.update(id, changes);
}

/**
 * Saves new details and, when the wedding date moves, can shift every unfinished
 * task's due date by the same number of days (never earlier than today).
 */
export async function updateWeddingDetails(
  wedding: Wedding,
  changes: WeddingChanges,
  moveTaskDates: boolean,
): Promise<number> {
  const oldDate = parseDate(wedding.weddingDate);
  const newDate = changes.weddingDate ? parseDate(changes.weddingDate) : null;
  const shift = oldDate && newDate ? differenceInCalendarDays(newDate, oldDate) : 0;
  let moved = 0;

  await db.transaction('rw', db.wedding, db.tasks, async () => {
    await db.wedding.update(wedding.id, changes);
    if (!moveTaskDates || shift === 0) return;

    const today = startOfToday();
    moved = await db.tasks
      .filter((task) => !task.completed && Boolean(task.dueDate))
      .modify((task) => {
        const due = parseDate(task.dueDate);
        if (due) task.dueDate = toISODate(max([addDays(due, shift), today]));
      });
  });
  return moved;
}

/** Deletes everything in the planner. The app returns to the welcome screen. */
export async function resetAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.wedding, db.tasks, db.budgetItems, db.guests, db.seatingTables, db.events, db.meta],
    async () => {
      await Promise.all([
        db.wedding.clear(),
        db.tasks.clear(),
        db.budgetItems.clear(),
        db.guests.clear(),
        db.seatingTables.clear(),
        db.events.clear(),
        db.meta.clear(),
      ]);
    },
  );
  // UI preferences kept in localStorage go too.
  for (const key of ['wp-theme', 'wp-checklist-collapsed']) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage unavailable */
    }
  }
}
