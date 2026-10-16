import { THEME_NAMES, type ThemeName } from '@/types';
import { readLocal, writeLocal } from './localStore';

export interface ThemeOption {
  name: ThemeName;
  label: string;
  /** Swatch colours for the theme picker: [primary, soft, accent] */
  swatch: [string, string, string];
}

export const THEMES: readonly ThemeOption[] = [
  { name: 'blush', label: 'Blush', swatch: ['#a64d63', '#f7e6ea', '#c59a74'] },
  { name: 'sage', label: 'Sage', swatch: ['#557459', '#e6ede4', '#b9965f'] },
  { name: 'navy', label: 'Navy & Gold', swatch: ['#1f3a5f', '#e4eaf3', '#b08d43'] },
  { name: 'terracotta', label: 'Terracotta', swatch: ['#a44c30', '#f7e5dc', '#cf9b52'] },
  { name: 'lavender', label: 'Lavender', swatch: ['#765a9b', '#eee8f6', '#c497b2'] },
  { name: 'classic', label: 'Classic', swatch: ['#1f1f1f', '#efebe3', '#b0924f'] },
];

export const DEFAULT_THEME: ThemeName = 'blush';

/** Must match the key read by the inline script in index.html. */
const THEME_STORAGE_KEY = 'wp-theme';

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value);
}

export function readStoredTheme(): ThemeName {
  const stored = readLocal(THEME_STORAGE_KEY);
  return isThemeName(stored) ? stored : DEFAULT_THEME;
}

/** Applies the theme to <html>, updates the browser UI colour and remembers it. */
export function applyTheme(theme: ThemeName): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  writeLocal(THEME_STORAGE_KEY, theme);

  const bg = getComputedStyle(root).getPropertyValue('--bg').trim();
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta && bg) meta.content = bg;
}
