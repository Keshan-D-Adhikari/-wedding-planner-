import { pdf } from '@react-pdf/renderer';
import { db } from '@/db/db';
import { todayISO } from '@/utils/date';
import { BudgetPdf } from './BudgetPdf';
import { ChecklistPdf } from './ChecklistPdf';
import { GuestListPdf } from './GuestListPdf';
import { readPalette } from './pdfTheme';
import { SeatingPdf } from './SeatingPdf';

export type PdfKind = 'checklist' | 'guests' | 'seating' | 'budget';

const FILE_NAMES: Record<PdfKind, string> = {
  checklist: 'wedding-checklist',
  guests: 'guest-list',
  seating: 'seating-chart',
  budget: 'wedding-budget',
};

/**
 * Builds a PDF in the browser. This module (and the large react-pdf library)
 * is only downloaded the first time someone asks for a PDF.
 */
export async function generatePdf(kind: PdfKind): Promise<{ blob: Blob; filename: string }> {
  const wedding = await db.wedding.toCollection().first();
  if (!wedding) throw new Error('No wedding found');
  const palette = readPalette();

  let doc;
  if (kind === 'checklist') {
    doc = <ChecklistPdf wedding={wedding} tasks={await db.tasks.toArray()} palette={palette} />;
  } else if (kind === 'budget') {
    doc = <BudgetPdf wedding={wedding} items={await db.budgetItems.toArray()} palette={palette} />;
  } else {
    const [guests, tables] = await Promise.all([db.guests.toArray(), db.seatingTables.toArray()]);
    doc =
      kind === 'guests' ? (
        <GuestListPdf wedding={wedding} guests={guests} tables={tables} palette={palette} />
      ) : (
        <SeatingPdf wedding={wedding} guests={guests} tables={tables} palette={palette} />
      );
  }

  const blob = await pdf(doc).toBlob();
  return { blob, filename: `${FILE_NAMES[kind]}-${todayISO()}.pdf` };
}
