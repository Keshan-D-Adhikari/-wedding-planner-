import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '@/db/db';
import { useWedding } from '@/hooks/useWedding';
import type { ThemeName } from '@/types';
import { applyTheme, readStoredTheme } from '@/utils/themes';
import { ThemeContext, type ThemeContextValue } from './themeContext';

/**
 * Source of truth for the theme:
 * 1. the saved wedding's `theme` (once onboarding is done), otherwise
 * 2. the last theme remembered in localStorage (used before a wedding exists).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { wedding } = useWedding();
  const [localTheme, setLocalTheme] = useState<ThemeName>(readStoredTheme);

  const theme = wedding?.theme ?? localTheme;

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = useCallback(
    async (next: ThemeName) => {
      setLocalTheme(next);
      if (wedding) await db.wedding.update(wedding.id, { theme: next });
    },
    [wedding],
  );

  const value = useMemo<ThemeContextValue>(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
