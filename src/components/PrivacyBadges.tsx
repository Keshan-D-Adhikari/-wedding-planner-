import { Ban, MailX, ShieldCheck, WifiOff } from 'lucide-react';
import { cx } from '@/utils/classNames';
import styles from './PrivacyBadges.module.css';

const BADGES = [
  { icon: MailX, label: 'No sign-up or email' },
  { icon: Ban, label: 'No ads' },
  { icon: ShieldCheck, label: 'Data stays on your device' },
  { icon: WifiOff, label: 'Works offline' },
] as const;

/** The app's promise in four short badges — our main difference from the big wedding sites. */
export function PrivacyBadges({ className }: { className?: string }) {
  return (
    <ul role="list" className={cx(styles.badges, className)} aria-label="Privacy promises">
      {BADGES.map(({ icon: Icon, label }) => (
        <li key={label} className={styles.badge}>
          <Icon aria-hidden size={14} />
          {label}
        </li>
      ))}
    </ul>
  );
}
