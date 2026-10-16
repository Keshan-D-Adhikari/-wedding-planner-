import { createContext } from 'react';
import type { ThemeName } from '@/types';

export interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
