import { APP_NAME } from '@/utils/constants';
import styles from './BrandMark.module.css';

interface BrandMarkProps {
  /** Smaller version for the mobile header */
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <span className={compact ? `${styles.brand} ${styles.compact}` : styles.brand}>
      <svg className={styles.logo} viewBox="0 0 64 64" aria-hidden>
        <circle cx="26" cy="36" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx="38" cy="36" r="12" fill="none" stroke="var(--accent)" strokeWidth="4" />
        <path d="M32 14l4 5-4 4-4-4z" fill="var(--accent)" />
      </svg>
      <span className={styles.name}>{APP_NAME}</span>
    </span>
  );
}
