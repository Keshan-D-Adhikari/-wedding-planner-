import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { CalendarDays, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { db } from '@/db/db';
import { addEvents } from '@/db/events';
import { useWedding } from '@/hooks/useWedding';
import type { WeddingEvent } from '@/types';
import { EventCard } from './EventCard';
import { EventFormDialog, type EventDialogConfig } from './EventFormDialog';
import styles from './EventsPage.module.css';
import { EVENT_PRESETS, sortEvents, summarizeEvent, type EventPreset } from './eventUtils';

export default function EventsPage() {
  const { wedding } = useWedding();
  const events = useLiveQuery(() => db.events.toArray());
  const guests = useLiveQuery(() => db.guests.toArray());
  const items = useLiveQuery(() => db.budgetItems.toArray());

  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<EventDialogConfig>({ mode: 'add' });
  const [dialogKey, setDialogKey] = useState(0);

  const sorted = useMemo(() => sortEvents(events ?? []), [events]);

  if (!wedding || !events || !guests || !items) return <PageLoader />;

  function openDialog(next: EventDialogConfig) {
    setConfig(next);
    setDialogKey((k) => k + 1);
    setOpen(true);
  }

  function addPreset(preset: EventPreset) {
    void addEvents(preset.events);
  }

  const addButton = (
    <Button icon={<Plus aria-hidden />} onClick={() => openDialog({ mode: 'add' })}>
      Add event
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Engagement, ceremony, homecoming — plan each celebration on its own."
        actions={addButton}
      />

      {sorted.length === 0 ? (
        <EmptyState
          icon={<CalendarDays aria-hidden />}
          title="Plan every celebration"
          message="Many weddings are several events. Start from a set and change anything, or add your own."
          action={
            <div className={styles.presets}>
              {EVENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={styles.preset}
                  onClick={() => addPreset(preset)}
                >
                  <span className={styles.presetTitle}>{preset.label}</span>
                  <span className={styles.presetText}>{preset.description}</span>
                </button>
              ))}
              <Button variant="secondary" onClick={() => openDialog({ mode: 'add' })}>
                Start from scratch
              </Button>
            </div>
          }
        />
      ) : (
        <>
          <ul role="list" className={styles.grid}>
            {sorted.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                summary={summarizeEvent(event, guests, items)}
                currency={wedding.currency}
                onEdit={(e: WeddingEvent) => openDialog({ mode: 'edit', event: e })}
              />
            ))}
          </ul>
          <p className={styles.tip}>
            Choose who is invited to each event when you add or edit a guest, and link costs to an
            event in the budget.
          </p>
        </>
      )}

      <EventFormDialog
        key={dialogKey}
        open={open}
        onOpenChange={setOpen}
        config={config}
        weddingDate={wedding.weddingDate}
      />
    </>
  );
}
