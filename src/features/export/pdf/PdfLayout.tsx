import type { ReactNode } from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { Wedding } from '@/types';
import { APP_NAME } from '@/utils/constants';
import { formatDate } from '@/utils/date';
import { getSiteUrl } from '@/utils/siteUrl';
import type { PdfStyles } from './pdfTheme';

interface PdfLayoutProps {
  title: string;
  /** Extra line under the couple's names, e.g. "18 of 62 tasks done" */
  summary?: string;
  wedding: Wedding;
  styles: PdfStyles;
  orientation?: 'portrait' | 'landscape';
  children: ReactNode;
}

/** A4 document with a title block on page 1 and a footer with page numbers on every page. */
export function PdfLayout({
  title,
  summary,
  wedding,
  styles,
  orientation = 'portrait',
  children,
}: PdfLayoutProps) {
  const couple = `${wedding.partner1Name} & ${wedding.partner2Name}`;
  const date = formatDate(wedding.weddingDate, 'd MMMM yyyy');

  return (
    <Document title={`${title} — ${couple}`} author={couple} creator={APP_NAME} producer={APP_NAME}>
      <Page size="A4" orientation={orientation} style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{couple}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {[date, wedding.venue, summary].filter(Boolean).join('  ·  ')}
          </Text>
        </View>

        {children}

        <View style={styles.footer} fixed>
          <Text>
            {APP_NAME} · {getSiteUrl()} · Printed{' '}
            {formatDate(new Date().toISOString(), 'd MMM yyyy')}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
