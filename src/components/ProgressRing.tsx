import type { ReactNode } from 'react';
import styles from './ProgressRing.module.css';

interface ProgressRingProps {
  /** 0–100 (values outside are clamped) */
  value: number;
  size?: number;
  strokeWidth?: number;
  /** Accessible name, e.g. "Checklist progress" */
  label: string;
  /** Content in the middle; defaults to the percentage */
  children?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

export function ProgressRing({
  value,
  size = 96,
  strokeWidth = 8,
  label,
  children,
  tone = 'primary',
}: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div
      className={styles.ring}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className={`${styles.indicator} ${styles[tone]}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.center}>{children ?? `${Math.round(clamped)}%`}</div>
    </div>
  );
}
