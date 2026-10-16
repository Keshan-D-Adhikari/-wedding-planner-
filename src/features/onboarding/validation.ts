import type { NewWeddingInput } from '@/db/wedding';
import { parseDate, todayISO } from '@/utils/date';
import { parseAmount } from '@/utils/number';
import type { DraftErrors, WeddingDraft } from './types';

export const STEP_COUNT = 3;
const MAX_NAME_LENGTH = 60;

function validateName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return 'Please enter a name.';
  if (name.length > MAX_NAME_LENGTH) return `Please keep it under ${MAX_NAME_LENGTH} characters.`;
  return undefined;
}

/** Validates only the fields shown on the given step (0-based). */
export function validateStep(step: number, draft: WeddingDraft): DraftErrors {
  const errors: DraftErrors = {};

  if (step === 0) {
    const p1 = validateName(draft.partner1Name);
    const p2 = validateName(draft.partner2Name);
    if (p1) errors.partner1Name = p1;
    if (p2) errors.partner2Name = p2;
  }

  if (step === 1) {
    if (!parseDate(draft.weddingDate)) {
      errors.weddingDate = 'Please choose a date — an estimate is fine.';
    } else if (draft.weddingDate < todayISO()) {
      // ISO "yyyy-MM-dd" strings sort correctly as plain text.
      errors.weddingDate = 'The date has to be today or in the future.';
    }
  }

  if (step === 2 && parseAmount(draft.totalBudget) === null) {
    errors.totalBudget = 'Please enter a number, like 1500000.';
  }

  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** Converts the validated draft into what the database expects. */
export function draftToWedding(draft: WeddingDraft): NewWeddingInput {
  const venue = draft.venue.trim();
  return {
    partner1Name: draft.partner1Name.trim(),
    partner2Name: draft.partner2Name.trim(),
    weddingDate: draft.weddingDate,
    venue: venue || undefined,
    totalBudget: parseAmount(draft.totalBudget) ?? 0,
    currency: draft.currency,
    theme: draft.theme,
  };
}
