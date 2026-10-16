/**
 * Safe localStorage wrappers. localStorage can throw (Safari private mode,
 * blocked cookies), and we never want that to crash the app.
 * Only use this for tiny UI preferences — real data goes in IndexedDB (Dexie).
 */
export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore — storage unavailable */
  }
}
