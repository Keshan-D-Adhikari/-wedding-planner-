import type { BudgetItem } from '@/types';
import { createId } from '@/utils/id';
import { db } from './db';

export type BudgetItemInput = Omit<BudgetItem, 'id'>;

export async function addBudgetItem(input: BudgetItemInput): Promise<string> {
  const id = createId();
  await db.budgetItems.add({ ...input, id });
  return id;
}

export async function addBudgetItems(inputs: BudgetItemInput[]): Promise<void> {
  await db.budgetItems.bulkAdd(inputs.map((input) => ({ ...input, id: createId() })));
}

/** Note: passing `undefined` for an optional field (e.g. vendorName) removes it. */
export async function updateBudgetItem(
  id: string,
  changes: Partial<BudgetItemInput>,
): Promise<void> {
  await db.budgetItems.update(id, changes);
}

export async function deleteBudgetItem(id: string): Promise<void> {
  await db.budgetItems.delete(id);
}
