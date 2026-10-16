import { cx } from '@/utils/classNames';
import styles from './StepIndicator.module.css';

interface StepIndicatorProps {
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div className={styles.wrap}>
      <p className={styles.text}>
        Step {current + 1} of {total}
      </p>
      <div className={styles.dots} aria-hidden>
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cx(
              styles.dot,
              index < current && styles.done,
              index === current && styles.current,
            )}
          />
        ))}
      </div>
    </div>
  );
}
