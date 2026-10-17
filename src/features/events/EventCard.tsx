import { CalendarDays, Clock, MapPin, Sparkles, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/Button';
import type { CurrencyCode, WeddingEvent } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { daysUntil, formatDate } from '@/utils/date';
import styles from './EventCard.module.css';
import { formatTime, type EventSummary } from './eventUtils';

function whenText(date: string | undefined): string {
  if (!date) return 'Date not set';
  const days = daysUntil(date);
  const label = formatDate(date, 'EEE, d MMM yyyy');
  if (days === null) return label;
  if (days === 0) return `${label} · today`;
  if (days === 1) return `${label} · tomorrow`;
  return days > 1 ? `${label} · in ${days} days` : label;
}

interface EventCardProps {
  event: WeddingEvent;
  summary: EventSummary;
  currency: CurrencyCode;
  onEdit: (event: WeddingEvent) => void;
}

export function EventCard({ event, summary, currency, onEdit }: EventCardProps) {
  const time = formatTime(event.time);
  const nakath = formatTime(event.nakath);

  return (
    <li className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.name}>{event.name}</h2>
        <Button variant="secondary" size="sm" onClick={() => onEdit(event)}>
          Edit<span className="visually-hidden"> {event.name}</span>
        </Button>
      </header>

      <ul role="list" className={styles.facts}>
        <li>
          <CalendarDays aria-hidden size={16} />
          {whenText(event.date)}
        </li>
        {time && (
          <li>
            <Clock aria-hidden size={16} />
            Starts {time}
          </li>
        )}
        {event.venue && (
          <li>
            <MapPin aria-hidden size={16} />
            {event.venue}
          </li>
        )}
      </ul>

      {nakath && (
        <p className={styles.nakath}>
          <Sparkles aria-hidden size={16} />
          <span>
            Auspicious time <strong>{nakath}</strong>
          </span>
        </p>
      )}

      {event.notes && <p className={styles.notes}>{event.notes}</p>}

      <dl className={styles.stats}>
        <div>
          <dt>
            <Users aria-hidden size={14} /> Guests attending
          </dt>
          <dd>{summary.headcount}</dd>
          <dd className={styles.sub}>
            {summary.pending > 0 ? `${summary.pending} still to reply` : 'incl. plus-ones'}
          </dd>
        </div>
        <div>
          <dt>
            <Wallet aria-hidden size={14} /> Planned cost
          </dt>
          <dd>{formatCurrency(summary.cost, currency)}</dd>
          <dd className={styles.sub}>{formatCurrency(summary.paid, currency)} paid</dd>
        </div>
      </dl>
    </li>
  );
}
