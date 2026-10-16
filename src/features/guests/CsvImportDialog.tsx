import { useId, useState, type ChangeEvent } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { addGuests } from '@/db/guests';
import type { Guest } from '@/types';
import styles from './CsvImportDialog.module.css';
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, parseGuestCsv, type GuestCsvResult } from './guestCsv';
import { RSVP_LABELS, sideLabel, type Partners } from './guestUtils';

const FIELD_LABELS: Record<GuestCsvResult['recognised'][number], string> = {
  name: 'Name',
  firstName: 'First name',
  lastName: 'Last name',
  side: 'Side',
  group: 'Group',
  rsvp: 'RSVP',
  plusOne: 'Plus one',
  meal: 'Meal',
  dietary: 'Dietary',
  phone: 'Phone',
  email: 'Email',
};

const PREVIEW_ROWS = 5;

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners: Partners;
  guests: Guest[];
  onDownloadTemplate: () => void;
  onImported: (count: number) => void;
}

/** Pick a CSV → see what we found → confirm. Nothing is saved until "Import". */
export function CsvImportDialog({
  open,
  onOpenChange,
  partners,
  guests,
  onDownloadTemplate,
  onImported,
}: CsvImportDialogProps) {
  const inputId = useId();
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<GuestCsvResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow choosing the same file again
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setError(null);

    if (file.size > MAX_IMPORT_BYTES) {
      setError('That file is too large. Please choose a CSV under 2 MB.');
      return;
    }

    try {
      const parsed = parseGuestCsv(await file.text(), partners, guests);
      if (parsed.guests.length === 0) {
        setError(
          parsed.duplicates > 0
            ? 'Everyone in this file is already on your guest list.'
            : "We couldn't find any guest names in this file. Check that it has a “Name” column.",
        );
        return;
      }
      setResult(parsed);
    } catch (err) {
      console.error('CSV import failed:', err);
      setError("We couldn't read that file. Please save it as CSV and try again.");
    }
  }

  async function handleImport() {
    if (!result) return;
    setIsSaving(true);
    try {
      await addGuests(result.guests);
      onImported(result.guests.length);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }

  const count = result?.guests.length ?? 0;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Import guests from CSV"
      description="Export your list from Excel, Google Sheets or Numbers as a .csv file. It never leaves your device."
    >
      <div className={form.form}>
        <div className={styles.picker}>
          <input
            id={inputId}
            type="file"
            accept=".csv,text/csv,text/plain"
            className={styles.fileInput}
            onChange={(e) => void handleFile(e)}
          />
          <label htmlFor={inputId} className={styles.dropLabel}>
            <Upload aria-hidden size={22} />
            <span className={styles.dropTitle}>{fileName || 'Choose a CSV file'}</span>
            <span className={styles.dropHint}>
              {fileName ? 'Tap to choose a different file' : `Up to ${MAX_IMPORT_ROWS} guests`}
            </span>
          </label>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {result && (
          <div className={styles.preview} role="status">
            <p className={styles.summary}>
              <strong>
                {count} {count === 1 ? 'guest' : 'guests'}
              </strong>{' '}
              ready to import
              {result.duplicates > 0 && ` · ${result.duplicates} already on your list (skipped)`}
              {result.skippedEmpty > 0 && ` · ${result.skippedEmpty} rows without a name (skipped)`}
              {result.truncated && ` · only the first ${MAX_IMPORT_ROWS} rows are imported`}
            </p>

            <p className={styles.columnsLabel}>Columns we understood:</p>
            <ul role="list" className={styles.chips}>
              {result.recognised.map((field) => (
                <li key={field}>{FIELD_LABELS[field]}</li>
              ))}
            </ul>

            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <caption className="visually-hidden">First rows of the import</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Side</th>
                    <th scope="col">RSVP</th>
                  </tr>
                </thead>
                <tbody>
                  {result.guests.slice(0, PREVIEW_ROWS).map((g, i) => (
                    <tr key={i}>
                      <td>{g.name}</td>
                      <td>{sideLabel(g.side, partners, true)}</td>
                      <td>{RSVP_LABELS[g.rsvp]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {count > PREVIEW_ROWS && (
                <p className={styles.more}>…and {count - PREVIEW_ROWS} more</p>
              )}
            </div>
          </div>
        )}

        <div className={form.actions}>
          <Button
            variant="ghost"
            icon={<FileSpreadsheet aria-hidden />}
            onClick={onDownloadTemplate}
            className={styles.template}
          >
            Get a template
          </Button>
          <Button onClick={() => void handleImport()} disabled={!result || isSaving}>
            {count > 0 ? `Import ${count} ${count === 1 ? 'guest' : 'guests'}` : 'Import'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
