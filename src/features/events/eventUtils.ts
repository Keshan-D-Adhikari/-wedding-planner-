import { format } from 'date-fns';
import { itemCost } from '@/features/budget/budgetUtils';
import { seatsFor } from '@/db/seating';
import type { BudgetItem, Guest, WeddingEvent } from '@/types';

export interface EventPreset {
  id: 'sri-lankan' | 'indian';
  label: string;
  description: string;
  events: { name: string; notes?: string }[];
}

/** Quick-start sets of events. Names are editable afterwards. */
export const EVENT_PRESETS: readonly EventPreset[] = [
  {
    id: 'sri-lankan',
    label: 'Sri Lankan wedding',
    description: 'Engagement, Poruwa ceremony, Homecoming and Reception',
    events: [
      { name: 'Engagement', notes: 'Betrothal / exchanging of rings.' },
      { name: 'Poruwa ceremony', notes: 'Main wedding ceremony. Confirm the Nakath times.' },
      { name: 'Wedding reception' },
      { name: 'Homecoming', notes: "Welcoming the bride to the groom's home." },
    ],
  },
  {
    id: 'indian',
    label: 'Indian wedding',
    description: 'Mehendi, Haldi, Sangeet, Wedding ceremony and Reception',
    events: [
      { name: 'Mehendi' },
      { name: 'Haldi' },
      { name: 'Sangeet' },
      { name: 'Wedding ceremony', notes: 'Confirm the Muhurat with your priest.' },
      { name: 'Reception' },
    ],
  },
];

/** Plain text comparison (ISO dates and "HH:mm" times sort correctly as text). */
const compareStrings = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Sort by date, then time, then the order the couple arranged them in. */
export function sortEvents(events: WeddingEvent[]): WeddingEvent[] {
  return [...events].sort((a, b) => {
    const byDate = compareStrings(a.date ?? '9999', b.date ?? '9999');
    if (byDate !== 0) return byDate;
    const byTime = compareStrings(a.time ?? '99:99', b.time ?? '99:99');
    return byTime !== 0 ? byTime : a.order - b.order;
  });
}

/** "08:46" → "8:46 AM" */
export function formatTime(time: string | undefined): string {
  if (!time || !/^\d{2}:\d{2}$/.test(time)) return '';
  const [h, m] = time.split(':').map(Number);
  return format(new Date(2000, 0, 1, h ?? 0, m ?? 0), 'h:mm a');
}

/** Is this guest invited to the event? Guests without a list are invited to everything. */
export function isInvited(guest: Guest, eventId: string): boolean {
  return !guest.eventIds || guest.eventIds.includes(eventId);
}

export interface EventSummary {
  /** Attending guests invited, incl. plus-ones */
  headcount: number;
  attending: number;
  pending: number;
  /** Planned cost of budget items linked to this event */
  cost: number;
  paid: number;
}

export function summarizeEvent(
  event: WeddingEvent,
  guests: Guest[],
  items: BudgetItem[],
): EventSummary {
  const invited = guests.filter((g) => isInvited(g, event.id));
  const attendingGuests = invited.filter((g) => g.rsvp === 'attending');
  const linked = items.filter((i) => i.eventId === event.id);
  return {
    headcount: attendingGuests.reduce((sum, g) => sum + seatsFor(g), 0),
    attending: attendingGuests.length,
    pending: invited.filter((g) => g.rsvp === 'pending').length,
    cost: linked.reduce((sum, i) => sum + itemCost(i), 0),
    paid: linked.reduce((sum, i) => sum + i.paid, 0),
  };
}
