/**
 * Creates a random UUID v4.
 *
 * `crypto.randomUUID()` only exists in secure contexts (https or localhost).
 * When testing on a phone via http://192.168.x.x it is undefined, so we fall
 * back to building a v4 UUID from `crypto.getRandomValues()`.
 */
export function createId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  // Per RFC 4122: set version (4) and variant (10xx) bits.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
