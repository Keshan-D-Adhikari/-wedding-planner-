import { useCallback, useState } from 'react';
import { TIMEFRAMES, type Timeframe } from '@/types';
import { readLocal, writeLocal } from '@/utils/localStore';

const STORAGE_KEY = 'wp-checklist-collapsed';

function readCollapsed(): Set<Timeframe> {
  try {
    const parsed: unknown = JSON.parse(readLocal(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return new Set();
    return new Set(TIMEFRAMES.filter((t) => parsed.includes(t)));
  } catch {
    return new Set();
  }
}

/** Remembers which timeframe sections the user collapsed (a UI preference, so localStorage). */
export function useCollapsedTimeframes() {
  const [collapsed, setCollapsed] = useState<ReadonlySet<Timeframe>>(readCollapsed);

  const toggle = useCallback((timeframe: Timeframe) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(timeframe)) next.delete(timeframe);
      else next.add(timeframe);
      writeLocal(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
