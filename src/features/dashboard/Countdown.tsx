import { CalendarHeart, MapPin } from 'lucide-react';
import type { Wedding } from '@/types';
import { daysUntil, formatDate } from '@/utils/date';
import styles from './Countdown.module.css';

function countdownText(days: number): { number: string; label: string } {
  if (days > 1) return { number: days.toLocaleString(), label: 'days to go' };
  if (days === 1) return { number: '1', label: 'day to go — tomorrow!' };
  if (days === 0) return { number: '♥', label: "It's your wedding day!" };
  const ago = Math.abs(days);
  return { number: ago.toLocaleString(), label: ago === 1 ? 'day married' : 'days married' };
}

export function Countdown({ wedding }: { wedding: Wedding }) {
  const days = daysUntil(wedding.weddingDate) ?? 0;
  const { number, label } = countdownText(days);
  const weeks = Math.floor(days / 7);

  return (
    <section className={styles.hero} aria-labelledby="couple-names">
      <h1 id="couple-names" className={styles.names}>
        {wedding.partner1Name} <span className={styles.amp}>&amp;</span> {wedding.partner2Name}
      </h1>

      <p className={styles.countdown}>
        <span className={styles.number}>{number}</span>
        <span className={styles.label}>{label}</span>
      </p>
      {weeks >= 2 && <p className={styles.weeks}>That's about {weeks} weeks</p>}

      <ul role="list" className={styles.meta}>
        <li>
          <CalendarHeart aria-hidden size={16} />
          {formatDate(wedding.weddingDate, 'EEEE, d MMMM yyyy')}
        </li>
        {wedding.venue && (
          <li>
            <MapPin aria-hidden size={16} />
            {wedding.venue}
          </li>
        )}
      </ul>
    </section>
  );
}
