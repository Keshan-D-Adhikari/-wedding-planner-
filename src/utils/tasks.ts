import type { ChecklistTask } from '@/types';
import { isPast } from './date';

const NO_DATE = '9999-12-31';

/** Sort by due date (tasks without a date last), then by original order. */
export function compareTasks(a: ChecklistTask, b: ChecklistTask): number {
  const dateA = a.dueDate ?? NO_DATE;
  const dateB = b.dueDate ?? NO_DATE;
  if (dateA !== dateB) return dateA < dateB ? -1 : 1;
  return a.order - b.order;
}

export function isTaskOverdue(task: ChecklistTask): boolean {
  return !task.completed && isPast(task.dueDate);
}
