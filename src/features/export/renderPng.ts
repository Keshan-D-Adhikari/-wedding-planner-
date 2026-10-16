import cormorant500Italic from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-italic.woff2?url';
import cormorant500 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2?url';
import cormorant600 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2?url';
import dmSans from '@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2?url';
import { toBlob } from 'html-to-image';

export const CARD_WIDTH = 1000;
export const CARD_HEIGHT = 1500;

/**
 * The exact font files the cards use. html-to-image would otherwise inline every
 * subset of every font on the page (Cyrillic, Vietnamese…) — dozens of files and
 * ~20 seconds of work. These four Latin files are ~120 KB and take a moment.
 */
const CARD_FONTS = [
  { family: 'Cormorant Garamond', weight: '500', style: 'normal', url: cormorant500 },
  { family: 'Cormorant Garamond', weight: '600', style: 'normal', url: cormorant600 },
  { family: 'Cormorant Garamond', weight: '500', style: 'italic', url: cormorant500Italic },
  { family: 'DM Sans Variable', weight: '100 1000', style: 'normal', url: dmSans },
];

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error(`Could not read font ${url}`));
    reader.onerror = () => reject(new Error(`Could not read font ${url}`));
    reader.readAsDataURL(blob);
  });
}

let fontCss: Promise<string> | null = null;

/** Builds (once) the @font-face CSS embedded into each image. Safe to call early. */
export function prepareCardFonts(): Promise<string> {
  fontCss ??= Promise.all(
    CARD_FONTS.map(
      async (f) =>
        `@font-face{font-family:'${f.family}';font-style:${f.style};font-weight:${f.weight};` +
        `font-display:block;src:url(${await toDataUrl(f.url)}) format('woff2');}`,
    ),
  )
    .then((rules) => rules.join('\n'))
    .catch((error: unknown) => {
      console.warn('Card fonts could not be embedded; using fallbacks.', error);
      fontCss = null; // allow a retry next time
      return '';
    });
  return fontCss;
}

/** Safari sometimes paints web fonts only on the second render of an SVG snapshot. */
const isWebKit = /^((?!chrome|android|crios|fxios).)*safari/i.test(navigator.userAgent);

/**
 * Turns a card element into a 1000×1500 PNG — entirely in the browser,
 * nothing is uploaded. `pixelRatio: 1` keeps the exact Pinterest size.
 */
export async function renderCardPng(node: HTMLElement): Promise<Blob> {
  const options = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    pixelRatio: 1,
    cacheBust: true,
    fontEmbedCSS: await prepareCardFonts(),
  };

  if (isWebKit) await toBlob(node, options);
  const blob = await toBlob(node, options);
  if (!blob) throw new Error('Could not create the image');
  return blob;
}

/** True when this device can share image files straight to apps (e.g. Pinterest on a phone). */
export function canShareFiles(): boolean {
  try {
    const probe = new File([new Blob()], 'probe.png', { type: 'image/png' });
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}
