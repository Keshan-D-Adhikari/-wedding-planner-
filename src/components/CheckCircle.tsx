import type { ComponentPropsWithRef } from 'react';
import { Check } from 'lucide-react';
import styles from './CheckCircle.module.css';

type CheckCircleProps = Omit<ComponentPropsWithRef<'input'>, 'type'>;

/**
 * Round, animated checkbox. A real <input type="checkbox"> sits on top (invisible),
 * so it works with keyboard, screen readers and labels. Wrap it in a <label>.
 */
export function CheckCircle(props: CheckCircleProps) {
  return (
    <span className={styles.wrap}>
      <input type="checkbox" className={styles.input} {...props} />
      <span className={styles.box} aria-hidden>
        <Check size={14} strokeWidth={3} />
      </span>
    </span>
  );
}
