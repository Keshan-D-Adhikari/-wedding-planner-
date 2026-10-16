import type { BudgetItemInput } from '@/db/budget';
import type { BudgetCategory } from '@/types';

/**
 * A typical split of a wedding budget — a starting point, not advice.
 * Shares add up to 100%.
 */
const SUGGESTIONS: { category: BudgetCategory; name: string; share: number }[] = [
  { category: 'Venue', name: 'Venue hire', share: 0.2 },
  { category: 'Catering', name: 'Food & drinks', share: 0.28 },
  { category: 'Photography', name: 'Photographer & video', share: 0.1 },
  { category: 'Attire', name: 'Wedding outfits', share: 0.08 },
  { category: 'Flowers', name: 'Flowers', share: 0.06 },
  { category: 'Music', name: 'Band or DJ', share: 0.05 },
  { category: 'Decor', name: 'Decorations', share: 0.07 },
  { category: 'Rings', name: 'Wedding rings', share: 0.04 },
  { category: 'Stationery', name: 'Invitations & stationery', share: 0.02 },
  { category: 'Transport', name: 'Transport', share: 0.03 },
  { category: 'Beauty', name: 'Hair & makeup', share: 0.03 },
  { category: 'Other', name: 'Extras & buffer', share: 0.04 },
];

/** Builds starter items with estimates split from the total budget (rounded to whole numbers). */
export function buildSuggestedItems(totalBudget: number): BudgetItemInput[] {
  return SUGGESTIONS.map(({ category, name, share }) => ({
    category,
    name,
    estimated: Math.round(totalBudget * share),
    actual: 0,
    paid: 0,
  }));
}
