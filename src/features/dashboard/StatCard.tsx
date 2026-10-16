import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router';
import { ProgressBar } from '@/components/ProgressBar';
import styles from './StatCard.module.css';

interface StatCardProps {
  to: string;
  icon: LucideIcon;
  label: string;
  /** The big number, already formatted */
  value: string;
  /** Small line under the value */
  detail: string;
  /** 0–100 for the progress bar */
  percent: number;
  tone?: 'primary' | 'success' | 'warning' | 'danger';
}

export function StatCard({
  to,
  icon: Icon,
  label,
  value,
  detail,
  percent,
  tone = 'primary',
}: StatCardProps) {
  return (
    <Link to={to} className={styles.card}>
      <span className={styles.top}>
        <span className={styles.icon}>
          <Icon aria-hidden size={18} strokeWidth={1.75} />
        </span>
        <span className={styles.label}>{label}</span>
      </span>
      <span className={styles.value}>{value}</span>
      <span className={styles.detail}>{detail}</span>
      <ProgressBar value={percent} label={`${label} progress`} tone={tone} />
    </Link>
  );
}
