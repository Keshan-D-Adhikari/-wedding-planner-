import { Font, StyleSheet } from '@react-pdf/renderer';
import cormorant500 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff?url';
import cormorant600 from '@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff?url';
import type { CurrencyCode } from '@/types';

/*
 * PDFs use the same serif for headings as the app. Body text uses the PDF's
 * built-in Helvetica, which supports Latin characters (incl. accents) only.
 */
Font.register({
  family: 'Cormorant',
  fonts: [
    { src: cormorant500, fontWeight: 500 },
    { src: cormorant600, fontWeight: 600 },
  ],
});
// Don't break words with hyphens — names look wrong split in half.
Font.registerHyphenationCallback((word) => [word]);

export interface PdfPalette {
  primary: string;
  primarySoft: string;
  accent: string;
  text: string;
  muted: string;
  border: string;
}

/** Reads the active theme's colours so printed documents match the app. */
export function readPalette(): PdfPalette {
  const css = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return {
    primary: get('--primary', '#a64d63'),
    primarySoft: get('--primary-soft', '#f7e6ea'),
    accent: get('--accent', '#c59a74'),
    text: get('--text', '#3a2a2f'),
    muted: get('--text-muted', '#77636a'),
    border: get('--border', '#efe2e5'),
  };
}

/**
 * Money for PDFs. Helvetica has no ₹ glyph, so rupees use the "INR" code;
 * every other currency keeps its normal symbol.
 */
export function pdfMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    currencyDisplay: currency === 'INR' ? 'code' : 'narrowSymbol',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function createStyles(p: PdfPalette) {
  return StyleSheet.create({
    page: {
      paddingTop: 44,
      paddingBottom: 60,
      paddingHorizontal: 44,
      fontFamily: 'Helvetica',
      fontSize: 10,
      color: p.text,
      lineHeight: 1.35,
    },
    header: {
      marginBottom: 18,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: p.border,
    },
    eyebrow: {
      fontSize: 8,
      letterSpacing: 2,
      textTransform: 'uppercase',
      color: p.primary,
      fontFamily: 'Helvetica-Bold',
    },
    title: { marginTop: 4, fontFamily: 'Cormorant', fontWeight: 600, fontSize: 28, color: p.text },
    subtitle: { marginTop: 2, fontSize: 10, color: p.muted },
    sectionTitle: {
      marginTop: 14,
      marginBottom: 6,
      fontFamily: 'Cormorant',
      fontWeight: 600,
      fontSize: 15,
      color: p.primary,
    },
    muted: { color: p.muted },
    small: { fontSize: 8, color: p.muted },
    bold: { fontFamily: 'Helvetica-Bold' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      borderBottomWidth: 0.5,
      borderBottomColor: p.border,
    },
    tableHead: {
      flexDirection: 'row',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: p.primary,
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: p.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    summaryBox: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 6,
      padding: 10,
      borderRadius: 6,
      backgroundColor: p.primarySoft,
    },
    summaryItem: { width: '33.33%', paddingVertical: 4 },
    summaryValue: { fontFamily: 'Cormorant', fontWeight: 600, fontSize: 16 },
    summaryLabel: { fontSize: 7, letterSpacing: 1, textTransform: 'uppercase', color: p.muted },
    footer: {
      position: 'absolute',
      left: 44,
      right: 44,
      bottom: 26,
      flexDirection: 'row',
      justifyContent: 'space-between',
      fontSize: 7.5,
      color: p.muted,
    },
  });
}

export type PdfStyles = ReturnType<typeof createStyles>;
