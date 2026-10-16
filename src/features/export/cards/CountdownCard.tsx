import type { Ref } from 'react';
import type { Wedding } from '@/types';
import { daysUntil, formatDate } from '@/utils/date';
import { CardFrame, CoupleNames, Ornament } from './CardFrame';
import styles from './cards.module.css';

function countdown(days: number): { eyebrow: string; number: string; label: string } {
  if (days > 1)
    return {
      eyebrow: 'The countdown is on',
      number: days.toLocaleString(),
      label: 'days until we say “I do”',
    };
  if (days === 1) return { eyebrow: 'Almost there', number: '1', label: 'day until we say “I do”' };
  if (days === 0) return { eyebrow: 'Today is the day', number: '♥', label: 'we say “I do” today' };
  const ago = Math.abs(days).toLocaleString();
  return {
    eyebrow: 'Happily married',
    number: ago,
    label: Math.abs(days) === 1 ? 'day married' : 'days married',
  };
}

export function CountdownCard({ wedding, ref }: { wedding: Wedding; ref?: Ref<HTMLDivElement> }) {
  const days = daysUntil(wedding.weddingDate) ?? 0;
  const { eyebrow, number, label } = countdown(days);

  return (
    <CardFrame eyebrow={eyebrow} ref={ref}>
      <CoupleNames first={wedding.partner1Name} second={wedding.partner2Name} />
      <p className={styles.hugeNumber}>{number}</p>
      <p className={styles.bigLabel}>{label}</p>
      <Ornament />
      <p className={styles.date}>{formatDate(wedding.weddingDate, 'EEEE, d MMMM yyyy')}</p>
      {wedding.venue && <p className={styles.venue}>{wedding.venue}</p>}
    </CardFrame>
  );
}
