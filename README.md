# 💍 Wedding Planner

**Plan your whole wedding in one beautiful place — free forever.**

A free, mobile-first wedding planner with a checklist, budget, guest list, seating chart and
Pinterest-ready share cards. There is no sign-up, no paywall and no tracking. **All data stays on
your device** (IndexedDB in the browser), and the app works offline once it has loaded.

---

## Features

| Area           | What you can do                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Onboarding     | 3 friendly steps (names → date & venue → budget, currency & theme); 62 starter tasks dated back from the wedding      |
| Dashboard      | Countdown, progress for every section, "up next" tasks, backup reminder                                               |
| Checklist      | Tasks grouped by timeframe, collapsible, tick with animation, add/edit/delete, filters, overdue highlight             |
| Budget         | Totals & over-budget warning, items by category, payments, donut + estimated-vs-actual charts                         |
| Guest list     | Add, paste a whole list, CSV import/export, search & filters, quick RSVP, headcount incl. plus-ones                   |
| WhatsApp RSVPs | Personal invite links per guest (no server — you press Send), then paste the replies back to update RSVPs             |
| Events         | Several celebrations (engagement, Poruwa, homecoming, Mehendi…) with Nakath/Muhurat times, per-event guests and costs |
| Plan together  | Share your plan file with your partner; importing merges both copies (newest change wins)                             |
| Seating chart  | Round/long tables on a floor plan, drag or tap to seat guests, capacity checks (plus-ones = 2 seats)                  |
| Export & share | 1000×1500 Pinterest cards, A4 PDFs (checklist, guests, seating, budget), JSON backup & restore                        |
| Settings       | Edit details (optionally shifting task dates), theme, currency, storage status, delete all data                       |
| Offline / PWA  | Installable on phones, works without internet, asks before updating to a new version                                  |

## Tech stack

| Purpose        | Tool                                                    |
| -------------- | ------------------------------------------------------- |
| Build          | Vite                                                    |
| UI             | React + TypeScript (strict, `noUncheckedIndexedAccess`) |
| Routing        | React Router (`HashRouter`)                             |
| Styling        | CSS Modules + CSS custom properties (6 themes)          |
| UI primitives  | Radix UI (Dialog, Dropdown Menu)                        |
| Local database | Dexie.js (IndexedDB) + `dexie-react-hooks`              |
| Drag & drop    | dnd-kit                                                 |
| Charts         | Recharts                                                |
| PDF / image    | @react-pdf/renderer, html-to-image                      |
| Offline        | vite-plugin-pwa (Workbox)                               |
| Icons / dates  | lucide-react, date-fns                                  |
| Fonts          | Cormorant Garamond + DM Sans (self-hosted, Fontsource)  |
| Quality        | ESLint (type-aware) + Prettier                          |
| Hosting        | GitHub Pages via GitHub Actions                         |

## Getting started

Requirements: **Node.js 22+** (24 recommended) and npm.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

To test on your phone on the same Wi-Fi, run `npm run dev -- --host` and open the "Network" URL
on your phone.

## Scripts

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Start the dev server with hot reload                          |
| `npm run build`     | Type-check and build to `dist/` (incl. the service worker)    |
| `npm run preview`   | Serve the production build locally — use this to test offline |
| `npm run typecheck` | TypeScript check only                                         |
| `npm run lint`      | ESLint                                                        |
| `npm run format`    | Format all files with Prettier                                |
| `npm run icons`     | Regenerate PNG icons + social image from SVG (uses `sharp`)   |

## Project structure

```
src/
  app/            App shell, providers, routes, layout, update prompt
  components/     Shared UI: Button, Card, Modal, TextField, Toast, ProgressRing...
  features/       One folder per feature (onboarding, dashboard, checklist, budget,
                  guests, seating, export, settings) with its own .module.css files
  db/             Dexie database, data actions, starter checklist, backup/restore
  hooks/          Custom React hooks (useWedding, useTheme, useToast...)
  types/          TypeScript data models
  utils/          Formatting, dates, currency, CSV, downloads, themes, ids
  styles/         reset.css, variables.css, themes.css, global.css
scripts/          generate-icons.mjs
public/           favicon, app icons, social-share image
```

## Themes

Six colour themes live in `src/styles/themes.css` and are switched with
`<html data-theme="blush|sage|navy|terracotta|lavender|classic">`. Components only use CSS variables
such as `var(--primary)`, so they adapt to every theme automatically. Primary colours meet WCAG AA
contrast for white text.

## Deploying to Netlify (recommended)

1. Go to https://app.netlify.com → **Add new site → Import an existing project → GitHub**, and choose this repository.
2. Leave the settings as they are — `netlify.toml` already sets the build command, the `dist` folder and the Node version — and click **Deploy**.
3. In about a minute you get a link like `https://random-name.netlify.app`. Change it under **Site configuration → Change site name**.
4. Every push to `main` now redeploys automatically. No environment variables are needed.

Custom domain: **Domain management → Add a domain**, then follow the DNS steps Netlify shows.

## Alternative: GitHub Pages

The Pages workflow (`.github/workflows/deploy.yml`) is manual-only now: enable it with the steps below, then run it from the **Actions** tab.

1. Create a GitHub repository and push this project to the `main` branch.
2. In the repo go to **Settings → Pages → Build and deployment → Source** and choose
   **GitHub Actions**.
3. Run **Actions → Deploy to GitHub Pages → Run workflow**. It lints, builds and deploys.
   Your site appears at `https://<username>.github.io/<repo-name>/`.

The workflow sets Vite's `base` path and the public site URL (used for social-preview images)
automatically from `actions/configure-pages`, so you never hardcode the repository name.

### Custom domain (later)

1. Buy a domain and add DNS records at your registrar:
   - Apex domain (`example.com`): four `A` records pointing to `185.199.108.153`,
     `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   - Or a subdomain (`www.example.com`): a `CNAME` record pointing to `<username>.github.io`.
2. In **Settings → Pages → Custom domain**, enter your domain and save. Tick **Enforce HTTPS**
   once the certificate is issued (it can take up to an hour).
3. Re-run the deploy workflow. The base path becomes `/` and links update automatically.

> Browser data is stored per site address. Visitors who used the `github.io` URL won't see their
> data on the new domain, so remind early users to use **Export → Download backup** before you
> switch, then **Restore from file** on the new address.

## Final deploy checklist

Before sharing the link on Pinterest:

- [ ] `npm run lint` and `npm run build` pass locally.
- [ ] `npm run preview` → open the site, then turn off Wi-Fi and reload: it should still work.
- [ ] On a real phone: complete onboarding, tick a task, add a guest, seat a guest by tapping.
- [ ] Download a Pinterest card and open it — check it's 1000×1500 and the fonts look right.
- [ ] Download each PDF and print-preview it.
- [ ] Download a backup, delete all data in Settings, restore the backup.
- [ ] Add to home screen (Android: browser menu → Install; iPhone: Share → Add to Home Screen).
- [ ] Paste your live URL into a WhatsApp chat or https://www.opengraph.xyz to check the preview image.
- [ ] Settings → Pages shows "Your site is live", and **Enforce HTTPS** is on.
- [ ] (Optional) Change `APP_NAME` in `src/utils/constants.ts`, `vite.config.ts` and
      `index.html`, then run `npm run icons` if you changed the logo colours.

## Accessibility

- Semantic HTML, labelled inputs, visible focus rings, a skip link, and focus moves to the new
  page on navigation.
- Dialogs and menus use Radix (focus trap, Esc to close, focus return).
- Seating works without dragging: tap/Enter a guest, then a table; arrow keys nudge tables.
- Charts have a data table alongside; status is never shown by colour alone.
- Respects `prefers-reduced-motion`.
- Checked with axe-core (WCAG 2.1 AA) on every page.

## Privacy

There is no backend, no analytics and no third-party requests — fonts are bundled with the app.
Images, PDFs, CSV files and backups are all created in the browser. Because data lives only on the
device, the app reminds users to download a backup every couple of weeks.

## Known limitations

- PDFs use built-in fonts that cover Latin letters (incl. accents) only; names in other scripts
  (e.g. Sinhala, Tamil) show correctly in the app, CSV and images, but not in PDFs.
- Data doesn't sync between devices — use backup & restore to move it.
