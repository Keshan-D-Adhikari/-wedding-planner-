import { TIMEFRAMES, type ChecklistTask, type TaskCategory, type Timeframe } from '@/types';
import { compareTasks } from '@/utils/tasks';

export type StatusFilter = 'all' | 'pending' | 'done';

export interface ChecklistFilters {
  status: StatusFilter;
  category: TaskCategory | 'all';
  query: string;
}

export const DEFAULT_FILTERS: ChecklistFilters = { status: 'all', category: 'all', query: '' };

export function isFiltering(filters: ChecklistFilters): boolean {
  return filters.status !== 'all' || filters.category !== 'all' || filters.query.trim() !== '';
}

export function filterTasks(tasks: ChecklistTask[], filters: ChecklistFilters): ChecklistTask[] {
  const query = filters.query.trim().toLowerCase();

  return tasks.filter((task) => {
    if (filters.status === 'pending' && task.completed) return false;
    if (filters.status === 'done' && !task.completed) return false;
    if (filters.category !== 'all' && task.category !== filters.category) return false;
    if (query) {
      const haystack = `${task.title} ${task.notes ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

export interface TimeframeGroup {
  timeframe: Timeframe;
  /** Tasks to show (after filters), sorted */
  tasks: ChecklistTask[];
  /** Progress counts use ALL tasks in the timeframe, so filters don't change them */
  total: number;
  done: number;
}

/** Groups visible tasks by timeframe in timeline order; empty groups are left out. */
export function groupByTimeframe(
  allTasks: ChecklistTask[],
  visibleTasks: ChecklistTask[],
): TimeframeGroup[] {
  return TIMEFRAMES.map((timeframe) => {
    const inTimeframe = allTasks.filter((t) => t.timeframe === timeframe);
    return {
      timeframe,
      tasks: visibleTasks.filter((t) => t.timeframe === timeframe).sort(compareTasks),
      total: inTimeframe.length,
      done: inTimeframe.filter((t) => t.completed).length,
    };
  }).filter((group) => group.tasks.length > 0);
}
