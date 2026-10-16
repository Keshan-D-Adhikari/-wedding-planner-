/**
 * The site's public address without "https://", e.g. "amaya.github.io/wedding-planner".
 * Worked out at runtime, so it's right on GitHub Pages, a custom domain or localhost.
 */
export function getSiteUrl(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.host}${base}`;
}
