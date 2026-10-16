import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { NAV_ITEMS } from '@/app/navigation';
import { Card } from '@/components/Card';
import styles from './QuickLinks.module.css';

const DESCRIPTIONS: Record<string, string> = {
  '/checklist': 'Every task, perfectly timed',
  '/budget': 'Track costs and payments',
  '/guests': 'Invites, RSVPs and meals',
  '/seating': 'Arrange tables and seats',
  '/export': 'Pinterest cards, PDFs, backup',
  '/settings': 'Details, theme and currency',
};

const LINKS = NAV_ITEMS.filter((item) => item.to !== '/');

export function QuickLinks() {
  return (
    <Card as="nav" aria-labelledby="quick-links-heading">
      <h2 id="quick-links-heading" className={styles.title}>
        Plan your day
      </h2>
      <ul role="list" className={styles.list}>
        {LINKS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className={styles.link}>
              <span className={styles.icon}>
                <Icon aria-hidden size={18} strokeWidth={1.75} />
              </span>
              <span className={styles.text}>
                <span className={styles.label}>{label}</span>
                <span className={styles.description}>{DESCRIPTIONS[to]}</span>
              </span>
              <ChevronRight aria-hidden size={18} className={styles.chevron} />
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
