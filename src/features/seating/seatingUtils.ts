import { seatsFor } from '@/db/seating';
import type { Guest, SeatingTable, TableShape } from '@/types';

/** The floor plan is a fixed "virtual room"; it's scaled to fit the screen. */
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;
export const MIN_CAPACITY = 1;
export const MAX_CAPACITY = 30;
/** How far arrow keys nudge a focused table (canvas units). */
export const NUDGE_STEP = 20;

export interface Size {
  width: number;
  height: number;
}

/** Bigger tables for more seats, within sensible limits. */
export function tableSize(shape: TableShape, capacity: number): Size {
  if (shape === 'round') {
    const diameter = Math.min(260, Math.max(140, 120 + capacity * 10));
    return { width: diameter, height: diameter };
  }
  return { width: Math.min(400, Math.max(180, 120 + capacity * 18)), height: 110 };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Keeps a table fully inside the room. */
export function clampPosition(x: number, y: number, size: Size): { x: number; y: number } {
  return {
    x: Math.round(clamp(x, 0, CANVAS_WIDTH - size.width)),
    y: Math.round(clamp(y, 0, CANVAS_HEIGHT - size.height)),
  };
}

function overlaps(a: { x: number; y: number } & Size, b: { x: number; y: number } & Size): boolean {
  const gap = 24;
  return (
    a.x < b.x + b.width + gap &&
    a.x + a.width + gap > b.x &&
    a.y < b.y + b.height + gap &&
    a.y + a.height + gap > b.y
  );
}

/** Finds the first free spot on a grid for a new table, so new tables don't stack. */
export function findFreeSpot(existing: SeatingTable[], size: Size): { x: number; y: number } {
  const placed = existing.map((t) => ({ x: t.x, y: t.y, ...tableSize(t.shape, t.capacity) }));
  const step = 40;
  for (let y = 40; y + size.height <= CANVAS_HEIGHT; y += step) {
    for (let x = 40; x + size.width <= CANVAS_WIDTH; x += step) {
      const candidate = { x, y, ...size };
      if (!placed.some((p) => overlaps(candidate, p))) return { x, y };
    }
  }
  // Room is full: place near the centre and let the user arrange.
  return clampPosition(
    CANVAS_WIDTH / 2 - size.width / 2,
    CANVAS_HEIGHT / 2 - size.height / 2,
    size,
  );
}

/* ---------- Seat counting ---------- */

export interface TableOccupancy {
  guests: Guest[];
  used: number;
  free: number;
}

export function occupancyByTable(
  tables: SeatingTable[],
  guests: Guest[],
): Map<string, TableOccupancy> {
  const map = new Map<string, TableOccupancy>(
    tables.map((t) => [t.id, { guests: [], used: 0, free: t.capacity }]),
  );
  for (const guest of guests) {
    const entry = guest.tableId ? map.get(guest.tableId) : undefined;
    if (!entry) continue;
    entry.guests.push(guest);
    entry.used += seatsFor(guest);
  }
  for (const [id, entry] of map) {
    const table = tables.find((t) => t.id === id);
    entry.free = (table?.capacity ?? 0) - entry.used;
    entry.guests.sort((a, b) => a.name.localeCompare(b.name));
  }
  return map;
}

/**
 * Guests who still need a seat. Declined guests never appear;
 * pending ones only when the user asks to include them.
 */
export function unseatedGuests(guests: Guest[], includePending: boolean): Guest[] {
  return guests
    .filter((g) => !g.tableId)
    .filter((g) => g.rsvp === 'attending' || (includePending && g.rsvp === 'pending'))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Positions for the little seat dots drawn around a table (in % of the table box). */
export function seatPositions(
  shape: TableShape,
  capacity: number,
): { left: number; top: number }[] {
  if (shape === 'round') {
    return Array.from({ length: capacity }, (_, i) => {
      const angle = (i / capacity) * Math.PI * 2 - Math.PI / 2;
      return { left: 50 + Math.cos(angle) * 50, top: 50 + Math.sin(angle) * 50 };
    });
  }
  // Rectangle: split seats between the top and bottom edges.
  const top = Math.ceil(capacity / 2);
  const bottom = capacity - top;
  const row = (count: number, y: number) =>
    Array.from({ length: count }, (_, i) => ({ left: ((i + 1) / (count + 1)) * 100, top: y }));
  return [...row(top, 0), ...row(bottom, 100)];
}

/* ---------- Drag & drop data ---------- */

export type DragData = { type: 'guest'; guestId: string } | { type: 'table'; tableId: string };
export type DropData = { type: 'table'; tableId: string } | { type: 'unseated' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** dnd-kit's `data` is untyped, so we check its shape before trusting it. */
export function asDragData(value: unknown): DragData | null {
  if (!isRecord(value)) return null;
  if (value.type === 'guest' && typeof value.guestId === 'string') {
    return { type: 'guest', guestId: value.guestId };
  }
  if (value.type === 'table' && typeof value.tableId === 'string') {
    return { type: 'table', tableId: value.tableId };
  }
  return null;
}

export function asDropData(value: unknown): DropData | null {
  if (!isRecord(value)) return null;
  if (value.type === 'table' && typeof value.tableId === 'string') {
    return { type: 'table', tableId: value.tableId };
  }
  if (value.type === 'unseated') return { type: 'unseated' };
  return null;
}
