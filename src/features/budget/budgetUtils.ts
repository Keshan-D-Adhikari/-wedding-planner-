import { BUDGET_CATEGORIES, type BudgetItem } from '@/types';

/**
 * The best-known cost of an item: the actual cost once it's known,
 * otherwise the estimate. This is what "projected" totals are built from.
 */
export function itemCost(item: BudgetItem): number {
  return item.actual > 0 ? item.actual : item.estimated;
}

/** How much of an item is still unpaid (never negative). */
export function itemOutstanding(item: BudgetItem): number {
  return Math.max(0, itemCost(item) - item.paid);
}

export interface BudgetTotals {
  totalBudget: number;
  estimated: number;
  actual: number;
  paid: number;
  /** Sum of each item's best-known cost */
  projected: number;
  /** Budget left after the projected costs (negative = over budget) */
  remaining: number;
  /** Money still to be paid to vendors */
  outstanding: number;
  isOverBudget: boolean;
}

export function computeTotals(items: BudgetItem[], totalBudget: number): BudgetTotals {
  let estimated = 0;
  let actual = 0;
  let paid = 0;
  let projected = 0;
  let outstanding = 0;

  for (const item of items) {
    estimated += item.estimated;
    actual += item.actual;
    paid += item.paid;
    projected += itemCost(item);
    outstanding += itemOutstanding(item);
  }

  const remaining = totalBudget - projected;
  return {
    totalBudget,
    estimated,
    actual,
    paid,
    projected,
    remaining,
    outstanding,
    isOverBudget: totalBudget > 0 && remaining < 0,
  };
}

export interface CategorySummary {
  category: string;
  items: BudgetItem[];
  estimated: number;
  actual: number;
  projected: number;
}

/**
 * Totals per category. Known categories keep their usual order;
 * any custom categories follow alphabetically.
 */
export function summarizeByCategory(items: BudgetItem[]): CategorySummary[] {
  const map = new Map<string, CategorySummary>();

  for (const item of items) {
    let summary = map.get(item.category);
    if (!summary) {
      summary = { category: item.category, items: [], estimated: 0, actual: 0, projected: 0 };
      map.set(item.category, summary);
    }
    summary.items.push(item);
    summary.estimated += item.estimated;
    summary.actual += item.actual;
    summary.projected += itemCost(item);
  }

  const known = BUDGET_CATEGORIES as readonly string[];
  const rank = (category: string) => {
    const index = known.indexOf(category);
    return index === -1 ? known.length : index;
  };

  return [...map.values()]
    .map((summary) => ({
      ...summary,
      items: [...summary.items].sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => rank(a.category) - rank(b.category) || a.category.localeCompare(b.category));
}
