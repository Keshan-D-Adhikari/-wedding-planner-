import { db } from './db';

/**
 * Opens the database to confirm IndexedDB works in this browser.
 * Fails in some private/incognito modes or when storage is blocked.
 */
export async function checkDatabaseAvailable(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;
  try {
    await db.open();
    return true;
  } catch (error) {
    console.error('IndexedDB unavailable:', error);
    return false;
  }
}

/**
 * Asks the browser not to evict our data when the device is low on space.
 * Called after onboarding (Phase 2) — some browsers show a prompt, so we
 * don't call it on first page load.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
