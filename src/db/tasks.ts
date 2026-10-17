import type { ChecklistTask } from '@/types';
import { createId } from '@/utils/id';
import { db } from './db';
import { scheduleTasks } from './seed/defaultTasks';
import { TASK_PACKS, type TaskPack } from './seed/taskPacks';

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

/**
 * Adds a traditional-wedding task pack after the existing tasks. Tasks whose title
 * is already on the list are skipped, so adding a pack twice is harmless.
 * Returns how many tasks were added.
 */
export async function addTaskPack(packId: TaskPack['id'], weddingDate: string): Promise<number> {
  const pack = TASK_PACKS.find((p) => p.id === packId);
  if (!pack) return 0;

  return db.transaction('rw', db.tasks, async () => {
    const existing = await db.tasks.toArray();
    const known = new Set(existing.map((t) => t.title.trim().toLowerCase()));
    const last = existing.reduce((max, t) => Math.max(max, t.order), -1);

    const fresh = scheduleTasks(pack.templates, weddingDate, last + 1).filter(
      (task) => !known.has(task.title.trim().toLowerCase()),
    );
    if (fresh.length > 0) await db.tasks.bulkAdd(fresh);
    return fresh.length;
  });
}
