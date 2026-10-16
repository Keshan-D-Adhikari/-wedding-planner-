import { cx } from '@/utils/classNames';
import type { GuestStats as Stats } from './guestUtils';
import styles from './GuestStats.module.css';

const TILES: { key: keyof Stats; label: string; hint?: string }[] = [
  { key: 'invited', label: 'Invited' },
  { key: 'attending', label: 'Attending' },
  { key: 'pending', label: 'Pending' },
  { key: 'declined', label: 'Declined' },
  { key: 'plusOnes', label: 'Plus-ones' },
  { key: 'headcount', label: 'Headcount', hint: 'Attending + their plus-ones' },
];

export function GuestStats({ stats }: { stats: Stats }) {
  return (
    <dl className={styles.stats} aria-label="Guest counts">
      {TILES.map(({ key, label, hint }) => (
        <div key={key} className={cx(styles.tile, key === 'headcount' && styles.highlight)}>
          <dt className={styles.label} title={hint}>
            {label}
          </dt>
          <dd className={styles.value}>{stats[key].toLocaleString()}</dd>
          {hint && <dd className={styles.hint}>{hint}</dd>}
        </div>
      ))}
    </dl>
  );
}
