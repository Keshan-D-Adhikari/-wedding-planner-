import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ListPlus, Plus, SearchX, Upload, Users } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Toast } from '@/components/Toast';
import { db } from '@/db/db';
import { useToast } from '@/hooks/useToast';
import { useWedding } from '@/hooks/useWedding';
import type { Guest } from '@/types';
import { todayISO } from '@/utils/date';
import { downloadFile } from '@/utils/download';
import { sortEvents } from '@/features/events/eventUtils';
import { BulkAddDialog } from './BulkAddDialog';
import { CsvImportDialog } from './CsvImportDialog';
import { GuestActionsMenu } from './GuestActionsMenu';
import { guestCsvTemplate, guestsToCsv } from './guestCsv';
import { GuestFormDialog, type GuestDialogConfig } from './GuestFormDialog';
import { GuestList } from './GuestList';
import styles from './GuestsPage.module.css';
import { GuestStats } from './GuestStats';
import { PasteRepliesDialog } from './PasteRepliesDialog';
import { WhatsAppInviteDialog } from './WhatsAppInviteDialog';
import { GuestToolbar } from './GuestToolbar';
import {
  computeGuestStats,
  DEFAULT_GUEST_FILTERS,
  distinctGroups,
  filterGuests,
  isFilteringGuests,
  type GuestFilters,
} from './guestUtils';

const CSV_MIME = 'text/csv;charset=utf-8';

type DialogName = 'guest' | 'bulk' | 'import' | 'invite' | 'replies' | null;

export default function GuestsPage() {
  const { wedding } = useWedding();
  const guests = useLiveQuery(() => db.guests.toArray());
  const events = useLiveQuery(() => db.events.toArray());
  const [filters, setFilters] = useState<GuestFilters>(DEFAULT_GUEST_FILTERS);
  const toast = useToast();

  // One dialog at a time. Each keeps its last config while animating closed,
  // and gets a new key on open so its form starts fresh.
  const [openDialog, setOpenDialog] = useState<DialogName>(null);
  const [lastDialog, setLastDialog] = useState<Exclude<DialogName, null>>('guest');
  const [dialogKey, setDialogKey] = useState(0);
  const [guestConfig, setGuestConfig] = useState<GuestDialogConfig>({ mode: 'add' });

  const visible = useMemo(() => filterGuests(guests ?? [], filters), [guests, filters]);
  const stats = useMemo(() => computeGuestStats(guests ?? []), [guests]);
  const groups = useMemo(() => distinctGroups(guests ?? []), [guests]);

  if (!wedding || !guests || !events) return <PageLoader />;

  const partners = { partner1Name: wedding.partner1Name, partner2Name: wedding.partner2Name };
  const filtering = isFilteringGuests(filters);

  function show(dialog: Exclude<DialogName, null>) {
    setLastDialog(dialog);
    setDialogKey((k) => k + 1);
    setOpenDialog(dialog);
  }

  function openGuestDialog(config: GuestDialogConfig) {
    setGuestConfig(config);
    show('guest');
  }

  const onOpenChange = (open: boolean) => setOpenDialog(open ? lastDialog : null);

  async function handleExport() {
    const tables = await db.seatingTables.toArray();
    const csv = guestsToCsv(guests ?? [], partners, tables);
    downloadFile(csv, `guest-list-${todayISO()}.csv`, CSV_MIME);
    toast.show('Guest list exported — check your downloads.');
  }

  function handleTemplate() {
    downloadFile(guestCsvTemplate(partners), 'guest-list-template.csv', CSV_MIME);
    toast.show('Template downloaded.');
  }

  const added = (count: number) =>
    toast.show(`${count} ${count === 1 ? 'guest' : 'guests'} added.`);

  return (
    <>
      <PageHeader
        title="Guest list"
        subtitle="Invitations, RSVPs and meal choices in one place."
        actions={
          <>
            <Button icon={<Plus aria-hidden />} onClick={() => openGuestDialog({ mode: 'add' })}>
              Add guest
            </Button>
            <GuestActionsMenu
              canExport={guests.length > 0}
              onInvite={() => show('invite')}
              onReplies={() => show('replies')}
              onBulkAdd={() => show('bulk')}
              onImport={() => show('import')}
              onExport={() => void handleExport()}
              onTemplate={handleTemplate}
            />
          </>
        }
      />

      {guests.length === 0 ? (
        <EmptyState
          icon={<Users aria-hidden />}
          title="Who's celebrating with you?"
          message="Add guests one by one, paste a whole list, or import a spreadsheet."
          action={
            <div className={styles.emptyActions}>
              <Button icon={<Plus aria-hidden />} onClick={() => openGuestDialog({ mode: 'add' })}>
                Add a guest
              </Button>
              <Button
                variant="secondary"
                icon={<ListPlus aria-hidden />}
                onClick={() => show('bulk')}
              >
                Paste a list
              </Button>
              <Button
                variant="secondary"
                icon={<Upload aria-hidden />}
                onClick={() => show('import')}
              >
                Import CSV
              </Button>
            </div>
          }
        />
      ) : (
        <div className={styles.layout}>
          <GuestStats stats={stats} />
          <GuestToolbar
            filters={filters}
            onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
            partners={partners}
            groups={groups}
          />

          <p className={styles.count} role="status">
            {filtering
              ? `Showing ${visible.length} of ${guests.length} guests.`
              : `${guests.length} ${guests.length === 1 ? 'guest' : 'guests'}, A–Z.`}{' '}
            {filtering && (
              <button
                type="button"
                className={styles.clear}
                onClick={() => setFilters(DEFAULT_GUEST_FILTERS)}
              >
                Show everyone
              </button>
            )}
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={<SearchX aria-hidden />}
              title="No guests match"
              message="Try a different name or filter."
              action={
                <Button variant="secondary" onClick={() => setFilters(DEFAULT_GUEST_FILTERS)}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <GuestList
              guests={visible}
              partners={partners}
              onEdit={(guest: Guest) => openGuestDialog({ mode: 'edit', guest })}
            />
          )}
        </div>
      )}

      {lastDialog === 'guest' && (
        <GuestFormDialog
          key={dialogKey}
          open={openDialog === 'guest'}
          onOpenChange={onOpenChange}
          config={guestConfig}
          partners={partners}
          guests={guests}
          events={sortEvents(events)}
        />
      )}
      {lastDialog === 'bulk' && (
        <BulkAddDialog
          key={dialogKey}
          open={openDialog === 'bulk'}
          onOpenChange={onOpenChange}
          partners={partners}
          guests={guests}
          onAdded={added}
        />
      )}
      {lastDialog === 'invite' && (
        <WhatsAppInviteDialog
          key={dialogKey}
          open={openDialog === 'invite'}
          onOpenChange={onOpenChange}
          wedding={wedding}
          guests={guests}
        />
      )}
      {lastDialog === 'replies' && (
        <PasteRepliesDialog
          key={dialogKey}
          open={openDialog === 'replies'}
          onOpenChange={onOpenChange}
          guests={guests}
          onApplied={(message) => toast.show(message)}
        />
      )}
      {lastDialog === 'import' && (
        <CsvImportDialog
          key={dialogKey}
          open={openDialog === 'import'}
          onOpenChange={onOpenChange}
          partners={partners}
          guests={guests}
          onDownloadTemplate={handleTemplate}
          onImported={added}
        />
      )}

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </>
  );
}
