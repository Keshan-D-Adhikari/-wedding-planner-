import type { ChecklistTask } from '@/types';
import { createId } from '@/utils/id';
import { db } from './db';

/** The fields a user can set when adding or editing a task. */
export type TaskInput = Pick<
  ChecklistTask,
  'title' | 'notes' | 'category' | 'timeframe' | 'dueDate'
>;

export async function addTask(input: TaskInput): Promise<string> {
  // New tasks go after every existing one (within the same due date).
  const last = await db.tasks.orderBy('order').last();
  const task: ChecklistTask = {
    ...input,
    id: createId(),
    completed: false,
    isCustom: true,
    order: (last?.order ?? -1) + 1,
  };
  await db.tasks.add(task);
  return task.id;
}

/** Note: passing `undefined` for an optional field (e.g. notes) removes it. */
export async function updateTask(id: string, changes: Partial<TaskInput>): Promise<void> {
  await db.tasks.update(id, changes);
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

export async function setTaskCompleted(id: string, completed: boolean): Promise<void> {
  await db.tasks.update(id, { completed });
}
