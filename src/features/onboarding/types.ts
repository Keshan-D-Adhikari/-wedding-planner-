import type { CurrencyCode, ThemeName } from '@/types';

/** What the wizard collects. Numbers stay strings while typing, so inputs can be empty. */
export interface WeddingDraft {
  partner1Name: string;
  partner2Name: string;
  weddingDate: string;
  venue: string;
  totalBudget: string;
  currency: CurrencyCode;
  theme: ThemeName;
}

export type DraftErrors = Partial<Record<keyof WeddingDraft, string>>;

export interface StepProps {
  draft: WeddingDraft;
  errors: DraftErrors;
  onChange: (patch: Partial<WeddingDraft>) => void;
}
