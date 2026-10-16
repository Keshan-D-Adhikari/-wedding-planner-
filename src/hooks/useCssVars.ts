import { useMemo, useSyncExternalStore } from 'react';

/** Re-renders whenever <html data-theme> changes. */
function subscribeToTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}

function getThemeSnapshot(): string {
  return document.documentElement.dataset.theme ?? '';
}

/**
 * Reads CSS custom properties (e.g. "--primary") as plain colour strings.
 * Needed for libraries like Recharts that draw SVG and can't use var(--x) directly.
 * Values update automatically when the user switches theme.
 */
export function useCssVars<K extends string>(names: readonly K[]): Record<K, string> {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot);
  const key = names.join(',');

  return useMemo(() => {
    void theme; // recompute when the theme changes
    const styles = getComputedStyle(document.documentElement);
    const result = {} as Record<K, string>;
    for (const name of key.split(',') as K[]) {
      result[name] = styles.getPropertyValue(name).trim();
    }
    return result;
  }, [theme, key]);
}
