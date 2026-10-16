import type { GuestInput } from '@/db/guests';
import type { Guest, GuestSide, RsvpStatus, SeatingTable } from '@/types';
import { parseCsv, toCsv } from '@/utils/csv';
import { firstName, normalizeName, RSVP_LABELS, type Partners } from './guestUtils';

export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024; // 2 MB is thousands of guests

const EXPORT_HEADERS = [
  'Name',
  'Side',
  'Group',
  'RSVP',
  'Plus one',
  'Meal',
  'Dietary',
  'Phone',
  'Email',
  'Table',
];

/* ---------- Export ---------- */

function sideCell(side: GuestSide, partners: Partners): string {
  if (side === 'partner1') return partners.partner1Name;
  if (side === 'partner2') return partners.partner2Name;
  return 'Both';
}

export function guestsToCsv(guests: Guest[], partners: Partners, tables: SeatingTable[]): string {
  const tableNames = new Map(tables.map((t) => [t.id, t.name]));
  const rows = [...guests]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((g) => [
      g.name,
      sideCell(g.side, partners),
      g.group ?? '',
      RSVP_LABELS[g.rsvp],
      g.plusOne ? 'Yes' : 'No',
      g.mealChoice ?? '',
      g.dietary ?? '',
      g.phone ?? '',
      g.email ?? '',
      (g.tableId && tableNames.get(g.tableId)) ?? '',
    ]);
  return toCsv([EXPORT_HEADERS, ...rows]);
}

/** A ready-to-fill file that shows people which columns we understand. */
export function guestCsvTemplate(partners: Partners): string {
  return toCsv([
    EXPORT_HEADERS.slice(0, -1),
    ['Nimali Perera', partners.partner1Name, 'Family', 'Attending', 'Yes', 'Fish', '', '', ''],
    ['Ruwan Silva', partners.partner2Name, 'Friends', 'Pending', 'No', '', 'Vegetarian', '', ''],
    ['Dilini Fernando', 'Both', 'Work', 'Pending', 'No', '', '', '', ''],
  ]);
}

/* ---------- Import ---------- */

type Field =
  | 'name'
  | 'firstName'
  | 'lastName'
  | 'side'
  | 'group'
  | 'rsvp'
  | 'plusOne'
  | 'meal'
  | 'dietary'
  | 'phone'
  | 'email';

/** Header spellings we recognise, compared after lower-casing and removing symbols. */
const HEADER_ALIASES: Record<Field, string[]> = {
  name: ['name', 'fullname', 'guest', 'guestname', 'guests', 'names'],
  firstName: ['firstname', 'first', 'givenname'],
  lastName: ['lastname', 'last', 'surname', 'familyname'],
  side: ['side', 'guestof', 'partner', 'whoseside'],
  group: ['group', 'category', 'relationship', 'relation', 'type'],
  rsvp: ['rsvp', 'status', 'attending', 'response', 'coming', 'attendance'],
  plusOne: ['plusone', 'plus1', '1', 'guestplusone', 'plusones', 'partnerinvited'],
  meal: ['meal', 'mealchoice', 'menu', 'food', 'mealpreference'],
  dietary: ['dietary', 'diet', 'allergies', 'allergy', 'dietaryrequirements', 'dietaryneeds'],
  phone: ['phone', 'mobile', 'phonenumber', 'tel', 'telephone', 'contact', 'whatsapp'],
  email: ['email', 'emailaddress', 'mail'],
};

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
const normalizeValue = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

function fieldForHeader(header: string): Field | null {
  const key = normalizeHeader(header);
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [Field, string[]][]) {
    if (aliases.includes(key)) return field;
  }
  return null;
}

const YES = new Set([
  'yes',
  'y',
  'true',
  '1',
  'x',
  'attending',
  'accepted',
  'accept',
  'coming',
  'confirmed',
  'going',
]);
const NO = new Set([
  'no',
  'n',
  'false',
  '0',
  'declined',
  'decline',
  'notcoming',
  'cantcome',
  'regrets',
  'notattending',
]);

function parseRsvp(value: string): RsvpStatus {
  const v = normalizeValue(value);
  if (YES.has(v)) return 'attending';
  if (NO.has(v)) return 'declined';
  return 'pending';
}

function parsePlusOne(value: string): boolean {
  const v = normalizeValue(value);
  return v === 'yes' || v === 'y' || v === 'true' || v === '1' || v === 'x' || value.trim() === '✓';
}

function parseSide(value: string, partners: Partners): GuestSide {
  const v = normalizeValue(value);
  if (!v) return 'both';
  const matches = (name: string) => {
    const full = normalizeValue(name);
    const first = normalizeValue(firstName(name));
    return v === full || v === first || v.startsWith(first);
  };
  if (v === 'partner1' || matches(partners.partner1Name)) return 'partner1';
  if (v === 'partner2' || matches(partners.partner2Name)) return 'partner2';
  return 'both';
}

const clip = (value: string, max: number) => value.trim().slice(0, max);
const optional = (value: string | undefined, max = 200) => {
  const text = clip(value ?? '', max);
  return text || undefined;
};

export interface GuestCsvResult {
  guests: GuestInput[];
  /** Rows with no name */
  skippedEmpty: number;
  /** Names already on the list (or repeated in the file) */
  duplicates: number;
  /** True when the file had more rows than we import at once */
  truncated: boolean;
  /** Which of our fields were found as columns (for the preview) */
  recognised: Field[];
}

/**
 * Turns CSV text into new guests. Works with our own export, most spreadsheet
 * guest lists, or just a single column of names with no header.
 */
export function parseGuestCsv(text: string, partners: Partners, existing: Guest[]): GuestCsvResult {
  const rows = parseCsv(text);
  const header = rows[0] ?? [];
  const columns = header.map(fieldForHeader);
  const hasHeader = columns.includes('name') || columns.includes('firstName');

  // No recognisable header → treat the first column as names, every row as data.
  const fieldIndex = (field: Field) =>
    hasHeader ? columns.indexOf(field) : field === 'name' ? 0 : -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const truncated = dataRows.length > MAX_IMPORT_ROWS;

  const index = Object.fromEntries(
    (Object.keys(HEADER_ALIASES) as Field[]).map((field) => [field, fieldIndex(field)]),
  ) as Record<Field, number>;
  const cell = (row: string[], field: Field) =>
    index[field] >= 0 ? (row[index[field]] ?? '') : '';

  const seen = new Set(existing.map((g) => normalizeName(g.name)));
  const guests: GuestInput[] = [];
  let skippedEmpty = 0;
  let duplicates = 0;

  for (const row of dataRows.slice(0, MAX_IMPORT_ROWS)) {
    const joined = `${cell(row, 'firstName')} ${cell(row, 'lastName')}`.trim();
    const name = clip(cell(row, 'name') || joined, 100);
    if (!name) {
      skippedEmpty++;
      continue;
    }
    const key = normalizeName(name);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);

    guests.push({
      name,
      side: parseSide(cell(row, 'side'), partners),
      group: optional(cell(row, 'group'), 60),
      rsvp: parseRsvp(cell(row, 'rsvp')),
      plusOne: parsePlusOne(cell(row, 'plusOne')),
      mealChoice: optional(cell(row, 'meal'), 60),
      dietary: optional(cell(row, 'dietary')),
      phone: optional(cell(row, 'phone'), 40),
      email: optional(cell(row, 'email'), 120),
      tableId: null,
    });
  }

  const recognised = (Object.keys(index) as Field[]).filter((f) => index[f] >= 0);
  return { guests, skippedEmpty, duplicates, truncated, recognised };
}
