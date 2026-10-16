import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './ErrorScreen.module.css';

interface ErrorScreenProps {
  icon?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

/** Full-page friendly error. Used outside the router, so it must not use <Link>. */
export function ErrorScreen({ icon, title, message, actionLabel, onAction }: ErrorScreenProps) {
  return (
    <main className={styles.screen}>
      <div className={styles.card} role="alert">
        {icon && <div className={styles.icon}>{icon}</div>}
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.message}>{message}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className={styles.action}>
            {actionLabel}
          </Button>
        )}
      </div>
    </main>
  );
}
