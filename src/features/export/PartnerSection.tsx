import { useId, useState, type ChangeEvent } from 'react';
import { HeartHandshake, Merge, Send, TriangleAlert, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import {
  createBackup,
  MAX_BACKUP_BYTES,
  parseBackup,
  restoreBackup,
  type BackupFile,
} from '@/db/backup';
import { mergePartnerPlan, planMerge, SYNC_LABELS, type MergePlan } from '@/db/partnerSync';
import type { ToastTone } from '@/hooks/useToast';
import type { Wedding } from '@/types';
import { todayISO } from '@/utils/date';
import { downloadFile } from '@/utils/download';
import styles from './ExportPage.module.css';

interface PartnerSectionProps {
  wedding: Wedding;
  notify: (text: string, tone?: ToastTone) => void;
}

function planFileName(wedding: Wedding): string {
  const name = wedding.partner1Name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'our';
  return `wedding-plan-${name}-${todayISO()}.json`;
}

/** "3 new guests · 2 updated tasks" from merge counts. */
function describe(plan: Extract<MergePlan, { kind: 'merge' }>): string[] {
  const parts: string[] = [];
  for (const [key, { added, updated }] of Object.entries(plan.counts)) {
    const [one, many] = SYNC_LABELS[key as keyof typeof SYNC_LABELS];
    if (added) parts.push(`${added} new ${added === 1 ? one : many}`);
    if (updated) parts.push(`${updated} updated ${updated === 1 ? one : many}`);
  }
  return parts;
}

/**
 * Plan together without accounts: one partner sends their plan file (WhatsApp,
 * email, AirDrop…), the other imports it and the two copies are merged.
 */
export function PartnerSection({ wedding, notify }: PartnerSectionProps) {
  const inputId = useId();
  const [incoming, setIncoming] = useState<BackupFile | null>(null);
  const [plan, setPlan] = useState<MergePlan | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    setBusy(true);
    try {
      const backup = await createBackup();
      const json = JSON.stringify(backup);
      const name = planFileName(wedding);
      const file = new File([json], name, { type: 'application/json' });

      // On phones, open the share sheet (WhatsApp, Mail, AirDrop…); otherwise download.
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Our wedding plan',
            text: 'Open the wedding planner → Export & share → Import partner’s plan.',
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') return;
        }
      }
      downloadFile(json, name, 'application/json');
      notify('Plan file saved — send it to your partner on WhatsApp or email.');
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      notify('That file is too large to be a wedding plan.', 'error');
      return;
    }
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      notify(parsed.message, 'error');
      return;
    }
    setIncoming(parsed.backup);
    setPlan(await planMerge(parsed.backup));
    setOpen(true);
  }

  async function handleMerge() {
    if (!incoming) return;
    setBusy(true);
    try {
      const written = await mergePartnerPlan(incoming);
      setOpen(false);
      notify(
        written > 0
          ? `Plans combined — ${written} ${written === 1 ? 'change' : 'changes'} added.`
          : 'Already up to date.',
      );
    } catch (error) {
      console.error('Merge failed:', error);
      notify('Combining the plans failed — nothing was changed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleReplace() {
    if (!incoming) return;
    setBusy(true);
    try {
      await restoreBackup(incoming);
      setOpen(false);
      notify('Your planner now has your partner’s plan.');
    } catch (error) {
      console.error('Replace failed:', error);
      notify('Something went wrong — nothing was changed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="partner-heading">
      <div className={styles.sectionHeader}>
        <h2 id="partner-heading" className={styles.sectionTitle}>
          Plan together
        </h2>
        <p className={styles.sectionText}>
          Share your plan with your partner — no accounts needed. Send it whenever you've made
          changes; importing combines both of your updates.
        </p>
      </div>

      <div className={styles.backupCard}>
        <ol className={styles.howTo}>
          <li>
            <strong>Send:</strong> tap “Send my plan” and share the file on WhatsApp, email or
            AirDrop.
          </li>
          <li>
            <strong>Receive:</strong> your partner opens the planner, taps “Import partner’s plan”
            and chooses that file. On a new phone, they can import it from the welcome screen.
          </li>
          <li>
            Swap files again any time you both make changes. The newest change to each item wins.
          </li>
        </ol>
        <div className={styles.buttons}>
          <Button icon={<Send aria-hidden />} onClick={() => void handleSend()} disabled={busy}>
            Send my plan
          </Button>
          <input
            id={inputId}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            onChange={(e) => void handleFile(e)}
          />
          <label htmlFor={inputId} className={styles.fileButton}>
            <Upload aria-hidden size={18} />
            Import partner’s plan
          </label>
        </div>
        <p className={styles.hint}>
          Deleting something isn't shared — if one of you deletes an item, delete it on the other
          phone too.
        </p>
      </div>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title={plan?.kind === 'different' ? 'This is a different planner' : 'Combine your plans?'}
      >
        {plan?.kind === 'merge' && (
          <div className={form.form}>
            {plan.changes === 0 ? (
              <p className={form.note}>
                <HeartHandshake aria-hidden size={16} /> You're already up to date — nothing new in
                this file.
              </p>
            ) : (
              <div className={form.note}>
                <p>
                  <strong>
                    {plan.changes} {plan.changes === 1 ? 'change' : 'changes'}
                  </strong>{' '}
                  from your partner will be added:
                </p>
                <ul className={styles.changeList}>
                  {describe(plan).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className={form.actions}>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                {plan.changes === 0 ? 'Close' : 'Cancel'}
              </Button>
              {plan.changes > 0 && (
                <Button
                  icon={<Merge aria-hidden />}
                  onClick={() => void handleMerge()}
                  disabled={busy}
                >
                  Combine plans
                </Button>
              )}
            </div>
          </div>
        )}

        {plan?.kind === 'different' && (
          <div className={form.form}>
            <p className={form.note}>
              This file is for <strong>{plan.incomingCouple}</strong>, but your planner is{' '}
              <strong>{plan.localCouple}</strong>. Each of you started your own planner, so they
              can't be combined without doubling everything.
            </p>
            <p className={form.hint}>
              To plan together, one of you replaces theirs with the other's plan once. After that,
              swapping files combines your changes.
            </p>
            <div className={form.actions}>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Keep mine
              </Button>
              <Button
                variant="danger"
                icon={<TriangleAlert aria-hidden />}
                onClick={() => void handleReplace()}
                disabled={busy}
              >
                Replace mine with theirs
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}
