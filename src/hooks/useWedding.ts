import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/db';
import type { Wedding } from '@/types';

interface UseWeddingResult {
  wedding: Wedding | undefined;
  /** True only while the first query is running. */
  isLoading: boolean;
}

/**
 * Live view of the (single) wedding record. Re-renders automatically when it changes.
 *
 * useLiveQuery returns `undefined` while loading, and `first()` also returns
 * `undefined` when no wedding exists — so we wrap the result to tell them apart.
 */
export function useWedding(): UseWeddingResult {
  const result = useLiveQuery(async () => ({ wedding: await db.wedding.toCollection().first() }));
  return { wedding: result?.wedding, isLoading: result === undefined };
}
