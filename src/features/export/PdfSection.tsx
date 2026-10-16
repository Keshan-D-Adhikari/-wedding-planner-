import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Armchair, FileDown, ListChecks, Users, Wallet, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/Button';
import { db } from '@/db/db';
import type { ToastTone } from '@/hooks/useToast';
import { downloadFile } from '@/utils/download';
import styles from './ExportPage.module.css';
import type { PdfKind } from './pdf/generatePdf';

const DOCUMENTS: { kind: PdfKind; title: string; text: string; icon: LucideIcon }[] = [
  {
    kind: 'checklist',
    title: 'Checklist',
    text: 'Every task by timeframe, with tick boxes.',
    icon: ListChecks,
  },
  {
    kind: 'guests',
    title: 'Guest list',
    text: 'RSVPs, meals and tables for your venue.',
    icon: Users,
  },
  {
    kind: 'seating',
    title: 'Seating chart',
    text: 'Floor plan plus who sits at each table.',
    icon: Armchair,
  },
  { kind: 'budget', title: 'Budget', text: 'Every item, payment and total.', icon: Wallet },
];

interface PdfSectionProps {
  notify: (text: string, tone?: ToastTone) => void;
}

export function PdfSection({ notify }: PdfSectionProps) {
  const [busy, setBusy] = useState<PdfKind | null>(null);
  const counts = useLiveQuery(async () => ({
    checklist: await db.tasks.count(),
    guests: await db.guests.count(),
    seating: await db.seatingTables.count(),
    budget: await db.budgetItems.count(),
  }));

  async function handleDownload(kind: PdfKind, title: string) {
    setBusy(kind);
    try {
      // Loaded on demand: the PDF library is large and most visits never need it.
      const { generatePdf } = await import('./pdf/generatePdf');
      const { blob, filename } = await generatePdf(kind);
      downloadFile(blob, filename, 'application/pdf');
      notify(`${title} PDF saved.`);
    } catch (error) {
      console.error('PDF export failed:', error);
      notify("Sorry, we couldn't create that PDF. Please try again.", 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="pdf-heading">
      <div className={styles.sectionHeader}>
        <h2 id="pdf-heading" className={styles.sectionTitle}>
          Printable PDFs
        </h2>
        <p className={styles.sectionText}>
          Clean A4 pages to print, email to your planner or hand to your venue.
        </p>
      </div>

      <ul role="list" className={styles.pdfGrid}>
        {DOCUMENTS.map(({ kind, title, text, icon: Icon }) => {
          const empty = counts !== undefined && counts[kind] === 0;
          return (
            <li key={kind} className={styles.pdfCard}>
              <span className={styles.pdfIcon} aria-hidden>
                <Icon size={20} />
              </span>
              <span className={styles.pdfText}>
                <span className={styles.pdfTitle}>{title}</span>
                <span className={styles.hint}>{empty ? 'Nothing to print yet.' : text}</span>
              </span>
              <Button
                variant="secondary"
                size="sm"
                icon={<FileDown aria-hidden />}
                onClick={() => void handleDownload(kind, title)}
                disabled={busy !== null || empty || counts === undefined}
                aria-label={`Download ${title} PDF`}
              >
                {busy === kind ? 'Creating…' : 'PDF'}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className={styles.hint}>
        PDFs support names written in Latin letters (including accents).
      </p>
    </section>
  );
}
