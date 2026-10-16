import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useWedding } from '@/hooks/useWedding';
import { APP_NAME, PRIVACY_NOTE } from '@/utils/constants';
import { ResetDialog } from './ResetDialog';
import styles from './SettingsPage.module.css';
import { StorageStatus } from './StorageStatus';
import { ThemePicker } from './ThemePicker';
import { WeddingDetailsForm } from './WeddingDetailsForm';

export default function SettingsPage() {
  const { wedding } = useWedding();
  const toast = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  if (!wedding) return <PageLoader />;

  return (
    <>
      <PageHeader title="Settings" subtitle="Make your planner feel like yours." />

      <div className={styles.layout}>
        <Card as="section" aria-labelledby="details-heading">
          <h2 id="details-heading" className={styles.sectionTitle}>
            Wedding details
          </h2>
          <p className={styles.sectionText}>Names, date, venue and budget.</p>
          {/* Keyed by id so a restored backup refreshes the form */}
          <WeddingDetailsForm key={wedding.id} wedding={wedding} notify={toast.show} />
        </Card>

        <Card as="section" aria-labelledby="theme-heading">
          <h2 id="theme-heading" className={styles.sectionTitle}>
            Colour theme
          </h2>
          <p className={styles.sectionText}>
            Pick the palette that matches your wedding. Your Pinterest cards use it too.
          </p>
          <ThemePicker />
        </Card>

        <Card as="section" aria-labelledby="data-heading">
          <h2 id="data-heading" className={styles.sectionTitle}>
            Your data
          </h2>
          <p className={styles.sectionText}>
            {PRIVACY_NOTE} {APP_NAME} has no accounts, no servers and no tracking — everything is
            stored in this browser only.
          </p>
          <StorageStatus />
        </Card>

        <Card as="section" aria-labelledby="danger-heading" className={styles.danger}>
          <h2 id="danger-heading" className={styles.sectionTitle}>
            Start over
          </h2>
          <p className={styles.sectionText}>
            Permanently delete all your plans from this device and go back to the welcome screen.
          </p>
          <Button
            variant="danger"
            icon={<Trash2 aria-hidden />}
            onClick={() => {
              setResetKey((k) => k + 1);
              setResetOpen(true);
            }}
          >
            Delete all data
          </Button>
        </Card>
      </div>

      <ResetDialog key={resetKey} open={resetOpen} onOpenChange={setResetOpen} />
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </>
  );
}
