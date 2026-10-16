import { CircleAlert, CircleCheck, X } from 'lucide-react';
import type { ToastMessage } from '@/hooks/useToast';
import { cx } from '@/utils/classNames';
import styles from './Toast.module.css';

interface ToastProps {
  message: ToastMessage | null;
  onDismiss: () => void;
}

/**
 * Small message that floats above the bottom navigation.
 * The polite live region is always in the page so screen readers announce new
 * messages; error messages also carry role="alert" so they interrupt immediately.
 */
export function Toast({ message, onDismiss }: ToastProps) {
  const isError = message?.tone === 'error';

  return (
    <div className={styles.region} aria-live="polite">
      {message && (
        <div
          className={cx(styles.toast, isError && styles.error)}
          role={isError ? 'alert' : undefined}
        >
          {isError ? (
            <CircleAlert aria-hidden size={18} className={styles.icon} />
          ) : (
            <CircleCheck aria-hidden size={18} className={styles.icon} />
          )}
          <span>{message.text}</span>
          <button type="button" className={styles.close} onClick={onDismiss} aria-label="Dismiss">
            <X aria-hidden size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
