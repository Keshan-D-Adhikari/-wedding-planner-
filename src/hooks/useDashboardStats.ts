import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { ChecklistTask } from '@/types';
import { compareTasks, isTaskOverdue } from '@/utils/tasks';

export interface DashboardStats {
  tasksTotal: number;
  tasksDone: number;
  tasksOverdue: number;
  /** The next incomplete tasks, soonest first */
  nextTasks: ChecklistTask[];

  budgetEstimated: number;
  budgetActual: number;

  guestsInvited: number;
  guestsAttending: number;
  /** Attending guests + their plus-ones */
  headcount: number;

  tablesCount: number;
  guestsSeated: number;
}

const NEXT_TASK_LIMIT = 5;

/**
 * Live summary of every section for the dashboard.
 * Wedding data is small (hundreds of rows at most), so reading whole tables is fast.
 */
export function useDashboardStats(): DashboardStats | undefined {
  return useLiveQuery(async () => {
    const [tasks, budgetItems, guests, tablesCount] = await Promise.all([
      db.tasks.toArray(),
      db.budgetItems.toArray(),
      db.guests.toArray(),
      db.seatingTables.count(),
    ]);

    const pending = tasks.filter((t) => !t.completed).sort(compareTasks);
    const attending = guests.filter((g) => g.rsvp === 'attending');

    return {
      tasksTotal: tasks.length,
      tasksDone: tasks.length - pending.length,
      tasksOverdue: pending.filter(isTaskOverdue).length,
      nextTasks: pending.slice(0, NEXT_TASK_LIMIT),

      budgetEstimated: budgetItems.reduce((sum, item) => sum + item.estimated, 0),
      budgetActual: budgetItems.reduce((sum, item) => sum + item.actual, 0),

      guestsInvited: guests.length,
      guestsAttending: attending.length,
      headcount: attending.reduce((sum, g) => sum + (g.plusOne ? 2 : 1), 0),

      tablesCount,
      guestsSeated: attending.filter((g) => Boolean(g.tableId)).length,
    };
  });
}
