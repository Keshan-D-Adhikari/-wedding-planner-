import type { WeddingEvent } from '@/types';
import { createId } from '@/utils/id';
import { db } from './db';

export type EventInput = Omit<WeddingEvent, 'id' | 'order' | 'updatedAt'>;

export async function addEvents(inputs: EventInput[]): Promise<void> {
  const last = await db.events.orderBy('order').last();
  let order = (last?.order ?? -1) + 1;
  await db.events.bulkAdd(inputs.map((input) => ({ ...input, id: createId(), order: order++ })));
}

/** Note: passing `undefined` for an optional field (e.g. venue) removes it. */
export async function updateEvent(id: string, changes: Partial<EventInput>): Promise<void> {
  await db.events.update(id, changes);
}

/**
 * Deletes an event. Guests invited only to it become "invited to everything"
 * again, and budget items linked to it become general costs — nothing else is lost.
 */
export async function deleteEvent(id: string): Promise<void> {
  await db.transaction('rw', db.events, db.guests, db.budgetItems, async () => {
    await db.guests
      .filter((g) => Boolean(g.eventIds?.includes(id)))
      .modify((g) => {
        const rest = (g.eventIds ?? []).filter((e) => e !== id);
        if (rest.length === 0) delete g.eventIds;
        else g.eventIds = rest;
      });
    await db.budgetItems
      .filter((item) => item.eventId === id)
      .modify((item) => {
        delete item.eventId;
      });
    await db.events.delete(id);
  });
}
