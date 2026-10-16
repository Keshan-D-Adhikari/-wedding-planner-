import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site from /<repo-name>/ (or / with a custom domain).
// The deploy workflow sets BASE_PATH automatically; locally we serve from /.
const base = process.env.BASE_PATH ?? '/';

const APP_NAME = 'Wedding Planner';
const BG_COLOR = '#fcf8f7';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      // Ask before swapping to a new version, so nobody loses a half-typed form.
      registerType: 'prompt',
      // We register the service worker ourselves (see src/app/UpdatePrompt.tsx).
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: `${APP_NAME} — free & private`,
        short_name: APP_NAME,
        description:
          'Plan your whole wedding in one beautiful place: checklist, budget, guests and seating. Free, no sign-up, your data stays on your device.',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: BG_COLOR,
        theme_color: BG_COLOR,
        categories: ['lifestyle', 'productivity'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Everything needed to run offline. Only modern .woff2 fonts are cached,
        // plus the two .woff files the PDF generator embeds.
        globPatterns: [
          '**/*.{js,css,html,svg,png,woff2,webmanifest}',
          '**/cormorant-garamond-latin-{500,600}-normal-*.woff',
        ],
        globIgnores: ['og-image.png'],
        // The PDF chunk is large but should still work offline.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // The PDF chunk (react-pdf) is ~1.2 MB but is only downloaded when someone
    // creates a PDF, so it never slows down normal page loads.
    chunkSizeWarningLimit: 1300,
  },
});
