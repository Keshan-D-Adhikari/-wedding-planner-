import type { Guest, RsvpStatus } from '@/types';
import { createId } from '@/utils/id';
import { db } from './db';

export type GuestInput = Omit<Guest, 'id'>;

/**
 * A guest who declines can't keep a seat — otherwise they'd silently use up
 * a table's capacity in the seating chart.
 */
function withSeatRule<T extends Partial<GuestInput>>(changes: T): T {
  return changes.rsvp === 'declined' ? { ...changes, tableId: null } : changes;
}

export async function addGuest(input: GuestInput): Promise<string> {
  const id = createId();
  await db.guests.add({ ...withSeatRule(input), id });
  return id;
}

export async function addGuests(inputs: GuestInput[]): Promise<number> {
  await db.guests.bulkAdd(inputs.map((input) => ({ ...withSeatRule(input), id: createId() })));
  return inputs.length;
}

/** Note: passing `undefined` for an optional field (e.g. email) removes it. */
export async function updateGuest(id: string, changes: Partial<GuestInput>): Promise<void> {
  await db.guests.update(id, withSeatRule(changes));
}

export async function setGuestRsvp(id: string, rsvp: RsvpStatus): Promise<void> {
  await updateGuest(id, { rsvp });
}

export async function deleteGuest(id: string): Promise<void> {
  await db.guests.delete(id);
}
