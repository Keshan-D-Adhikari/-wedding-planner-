import { ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Toast } from '@/components/Toast';
import { useToast } from '@/hooks/useToast';
import { useWedding } from '@/hooks/useWedding';
import { PRIVACY_NOTE } from '@/utils/constants';
import { BackupSection } from './BackupSection';
import styles from './ExportPage.module.css';
import { PdfSection } from './PdfSection';
import { PinterestSection } from './PinterestSection';

export default function ExportPage() {
  const { wedding } = useWedding();
  const toast = useToast();

  if (!wedding) return <PageLoader />;

  return (
    <>
      <PageHeader title="Export & share" subtitle="Pinterest cards, printable PDFs and backups." />

      <div className={styles.layout}>
        <PinterestSection wedding={wedding} notify={toast.show} />
        <PdfSection notify={toast.show} />
        <BackupSection notify={toast.show} />

        <p className={styles.privacy}>
          <ShieldCheck aria-hidden size={16} />
          {PRIVACY_NOTE} Images, PDFs and backups are all created on your device.
        </p>
      </div>

      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </>
  );
}
