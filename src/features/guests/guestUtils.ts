import type { Guest, GuestSide, RsvpStatus, Wedding } from '@/types';

export type Partners = Pick<Wedding, 'partner1Name' | 'partner2Name'>;

export const DEFAULT_GROUPS = ['Family', 'Friends', 'Work', 'School', 'Neighbours'] as const;

export const RSVP_OPTIONS: readonly { value: RsvpStatus; label: string }[] = [
  { value: 'attending', label: 'Attending' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
];

export const RSVP_LABELS: Record<RsvpStatus, string> = {
  attending: 'Attending',
  pending: 'Pending',
  declined: 'Declined',
};

export const RSVP_VALUES = RSVP_OPTIONS.map((o) => o.value);
export const SIDE_VALUES: readonly GuestSide[] = ['partner1', 'partner2', 'both'];

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Amaya's side" (long) or "Amaya" (short); "Both" for shared guests. */
export function sideLabel(side: GuestSide, partners: Partners, short = false): string {
  if (side === 'both') return short ? 'Both' : 'Both sides';
  const name = firstName(side === 'partner1' ? partners.partner1Name : partners.partner2Name);
  return short ? name : `${name}'s side`;
}

export function sideOptions(partners: Partners): { value: GuestSide; label: string }[] {
  return SIDE_VALUES.map((value) => ({ value, label: sideLabel(value, partners, true) }));
}

/** For duplicate checks: "  Amaya   Perera " and "amaya perera" are the same person. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function distinctGroups(guests: Guest[]): string[] {
  const groups = new Set<string>();
  for (const guest of guests) if (guest.group?.trim()) groups.add(guest.group.trim());
  return [...groups].sort((a, b) => a.localeCompare(b));
}

/* ---------- Filters ---------- */

export interface GuestFilters {
  query: string;
  side: GuestSide | 'all';
  group: string; // 'all' or a group name
  rsvp: RsvpStatus | 'all';
}

export const DEFAULT_GUEST_FILTERS: GuestFilters = {
  query: '',
  side: 'all',
  group: 'all',
  rsvp: 'all',
};

export function isFilteringGuests(filters: GuestFilters): boolean {
  return (
    filters.query.trim() !== '' ||
    filters.side !== 'all' ||
    filters.group !== 'all' ||
    filters.rsvp !== 'all'
  );
}

/** Applies filters and sorts alphabetically by name. */
export function filterGuests(guests: Guest[], filters: GuestFilters): Guest[] {
  const query = normalizeName(filters.query);

  return guests
    .filter((guest) => {
      if (filters.side !== 'all' && guest.side !== filters.side) return false;
      if (filters.group !== 'all' && (guest.group ?? '') !== filters.group) return false;
      if (filters.rsvp !== 'all' && guest.rsvp !== filters.rsvp) return false;
      if (query) {
        const haystack = normalizeName(
          [guest.name, guest.group, guest.email, guest.phone, guest.mealChoice]
            .filter(Boolean)
            .join(' '),
        );
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/* ---------- Stats ---------- */

export interface GuestStats {
  invited: number;
  attending: number;
  pending: number;
  declined: number;
  /** Plus-ones for guests who haven't declined */
  plusOnes: number;
  /** Attending guests + their plus-ones — the number to give your caterer */
  headcount: number;
}

export function computeGuestStats(guests: Guest[]): GuestStats {
  const stats: GuestStats = {
    invited: guests.length,
    attending: 0,
    pending: 0,
    declined: 0,
    plusOnes: 0,
    headcount: 0,
  };

  for (const guest of guests) {
    stats[guest.rsvp]++;
    if (guest.plusOne && guest.rsvp !== 'declined') stats.plusOnes++;
    if (guest.rsvp === 'attending') stats.headcount += guest.plusOne ? 2 : 1;
  }
  return stats;
}

/* ---------- Pasted lists ---------- */

export const MAX_PASTED_NAMES = 1000;

/** Removes list markers people often paste: "1.", "2)", "-", "•", "*". */
function cleanLine(line: string): string {
  return line
    .replace(/^\s*(?:\d+[.)]|[-•*–])\s*/, '')
    .trim()
    .slice(0, 100);
}

/** Splits pasted text into new, unique names (skipping ones already on the list). */
export function parsePastedNames(text: string, existing: Guest[]) {
  const seen = new Set(existing.map((g) => normalizeName(g.name)));
  const names: string[] = [];
  let duplicates = 0;

  for (const raw of text.split(/\r?\n/)) {
    const name = cleanLine(raw);
    if (!name) continue;
    const key = normalizeName(name);
    if (seen.has(key)) {
      duplicates++;
      continue;
    }
    seen.add(key);
    names.push(name);
  }
  return {
    names: names.slice(0, MAX_PASTED_NAMES),
    duplicates,
    truncated: names.length > MAX_PASTED_NAMES,
  };
}
