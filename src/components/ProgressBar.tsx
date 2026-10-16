import { cx } from '@/utils/classNames';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** 0–100 (values outside are clamped) */
  value: number;
  label: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function ProgressBar({ value, label, tone = 'primary', className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));

  return (
    <div
      className={cx(styles.track, className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <div className={cx(styles.fill, styles[tone])} style={{ width: `${clamped}%` }} />
    </div>
  );
}
