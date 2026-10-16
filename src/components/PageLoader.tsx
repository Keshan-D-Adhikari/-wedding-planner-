import { cx } from '@/utils/classNames';
import styles from './PageLoader.module.css';

interface PageLoaderProps {
  /** Centre in the whole viewport instead of the content area */
  fullScreen?: boolean;
}

export function PageLoader({ fullScreen = false }: PageLoaderProps) {
  return (
    <div className={cx(styles.loader, fullScreen && styles.fullScreen)} role="status">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}
