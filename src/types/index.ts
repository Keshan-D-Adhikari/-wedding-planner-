/* ---------- Shared enums / unions ---------- */

export const THEME_NAMES = ['blush', 'sage', 'navy', 'terracotta', 'lavender', 'classic'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const CURRENCY_CODES = ['LKR', 'USD', 'GBP', 'EUR', 'INR', 'AUD', 'CAD'] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const TASK_CATEGORIES = [
  'Venue',
  'Attire',
  'Vendors',
  'Guests',
  'Ceremony',
  'Reception',
  'Legal',
  'Beauty',
  'Other',
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

/** Ordered from earliest to latest — this order is used for grouping in the UI. */
export const TIMEFRAMES = [
  '12+ months',
  '9-12 months',
  '6-9 months',
  '4-6 months',
  '2-4 months',
  '1 month',
  '1-2 weeks',
  'Day before',
  'Wedding day',
] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const BUDGET_CATEGORIES = [
  'Venue',
  'Catering',
  'Photography',
  'Attire',
  'Flowers',
  'Music',
  'Decor',
  'Rings',
  'Stationery',
  'Transport',
  'Beauty',
  'Other',
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export type GuestSide = 'partner1' | 'partner2' | 'both';
export type RsvpStatus = 'pending' | 'attending' | 'declined';
export type TableShape = 'round' | 'rectangle';

/* ---------- Data models (one per Dexie table) ---------- */

/**
 * Every synced record carries the time it last changed (ms since 1970). It is set
 * automatically by database hooks (see db.ts) and used to merge a partner's plan:
 * when both copies changed, the newer one wins.
 */
export interface Timestamped {
  updatedAt?: number;
}

export interface Wedding extends Timestamped {
  id: string;
  partner1Name: string;
  partner2Name: string;
  /** ISO date, e.g. "2027-06-12" */
  weddingDate: string;
  venue?: string;
  totalBudget: number;
  currency: CurrencyCode;
  theme: ThemeName;
  /** ISO timestamp */
  createdAt: string;
}

export interface ChecklistTask extends Timestamped {
  id: string;
  title: string;
  notes?: string;
  category: TaskCategory;
  timeframe: Timeframe;
  /** ISO date */
  dueDate?: string;
  completed: boolean;
  isCustom: boolean;
  order: number;
}

export interface BudgetItem extends Timestamped {
  id: string;
  /** Usually one of BUDGET_CATEGORIES, but users may type their own. */
  category: string;
  name: string;
  estimated: number;
  actual: number;
  paid: number;
  vendorName?: string;
  /** ISO date */
  dueDate?: string;
  notes?: string;
}

export interface Guest extends Timestamped {
  id: string;
  name: string;
  side: GuestSide;
  /** Family, Friends, Work... */
  group?: string;
  rsvp: RsvpStatus;
  plusOne: boolean;
  mealChoice?: string;
  dietary?: string;
  phone?: string;
  email?: string;
  tableId?: string | null;
}

export interface SeatingTable extends Timestamped {
  id: string;
  /** "Table 1", "Family Table" */
  name: string;
  shape: TableShape;
  capacity: number;
  /** Position on the floor plan */
  x: number;
  y: number;
}

/** Small key/value store for app-level metadata (e.g. last backup date). */
export interface AppMeta {
  key: MetaKey;
  value: string;
}

export type MetaKey = 'lastBackupAt' | 'backupReminderDismissedAt';
