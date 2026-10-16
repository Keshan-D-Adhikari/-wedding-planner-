import { Settings, Share2 } from 'lucide-react';
import { Link } from 'react-router';
import { BrandMark } from '@/components/BrandMark';
import styles from './MobileHeader.module.css';

/** Mobile-only top bar. Export & Settings live here because the bottom bar holds 5 items max. */
export function MobileHeader() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.brandLink} aria-label="Go to dashboard">
        <BrandMark compact />
      </Link>

      <div className={styles.actions}>
        <Link to="/export" className={styles.iconButton} aria-label="Export & share">
          <Share2 aria-hidden size={20} strokeWidth={1.75} />
        </Link>
        <Link to="/settings" className={styles.iconButton} aria-label="Settings">
          <Settings aria-hidden size={20} strokeWidth={1.75} />
        </Link>
      </div>
    </header>
  );
}
