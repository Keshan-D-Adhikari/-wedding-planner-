/**
 * Generates the PNG icons and the social-share image from SVG.
 * Run after changing the logo or brand colours:  npm run icons
 * The output is committed, so the deploy workflow doesn't need this step.
 */
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const OUT = new URL('../public/', import.meta.url);
const PRIMARY = '#a64d63';
const ACCENT = '#f3d9c4';
const BG = '#fcf8f7';

/** The rings logo. `inset` shrinks it inside the square (maskable icons need a safe zone). */
function logoSvg({ size, rounded = true, inset = 0 }) {
  const s = 64;
  const scale = 1 - inset * 2;
  const offset = (s * inset) / scale;
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${s} ${s}">
  <rect width="${s}" height="${s}" rx="${rounded ? 14 : 0}" fill="${PRIMARY}"/>
  <g transform="scale(${scale}) translate(${offset} ${offset})">
    <circle cx="26" cy="36" r="12" fill="none" stroke="#fff" stroke-width="4"/>
    <circle cx="38" cy="36" r="12" fill="none" stroke="${ACCENT}" stroke-width="4"/>
    <path d="M32 14l4 5-4 4-4-4z" fill="#fff"/>
  </g>
</svg>`;
}

/** 1200×630 Open Graph image for link previews (WhatsApp, Facebook, Pinterest, iMessage). */
function ogSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#f7e6ea"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1080" cy="40" r="210" fill="none" stroke="${PRIMARY}" stroke-opacity=".18" stroke-width="2"/>
  <circle cx="1170" cy="70" r="210" fill="none" stroke="#c59a74" stroke-opacity=".4" stroke-width="2"/>
  <rect x="36" y="36" width="1128" height="558" rx="28" fill="none" stroke="${PRIMARY}" stroke-opacity=".28" stroke-width="2"/>
  <g transform="translate(536 96) scale(2)">
    <circle cx="26" cy="36" r="12" fill="none" stroke="${PRIMARY}" stroke-width="4"/>
    <circle cx="38" cy="36" r="12" fill="none" stroke="#c59a74" stroke-width="4"/>
    <path d="M32 14l4 5-4 4-4-4z" fill="#c59a74"/>
  </g>
  <text x="600" y="310" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="78" fill="#3a2a2f">Plan your whole wedding</text>
  <text x="600" y="400" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="78" font-style="italic" fill="${PRIMARY}">in one beautiful place</text>
  <text x="600" y="490" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="4" fill="#77636a">CHECKLIST · BUDGET · GUESTS · SEATING — FREE FOREVER</text>
</svg>`;
}

async function png(svg, file, size) {
  const image = sharp(Buffer.from(svg));
  // fileURLToPath handles spaces (%20) and Windows drive letters correctly.
  await (size ? image.resize(size, size) : image)
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(file, OUT)));
  console.log('✓', file);
}

await mkdir(OUT, { recursive: true });
await png(logoSvg({ size: 512 }), 'icon-192.png', 192);
await png(logoSvg({ size: 512 }), 'icon-512.png', 512);
// Maskable: full-bleed square, logo inside the central 80% "safe zone".
await png(logoSvg({ size: 512, rounded: false, inset: 0.12 }), 'icon-maskable-512.png', 512);
// iOS home screen: opaque, no transparency, 180×180.
await png(logoSvg({ size: 180, rounded: false, inset: 0.08 }), 'apple-touch-icon.png', 180);
await png(ogSvg(), 'og-image.png');
console.log(`Done. Background colour for the manifest: ${BG}`);
