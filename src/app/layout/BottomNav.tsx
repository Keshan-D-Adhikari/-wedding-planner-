import { NavLink } from 'react-router';
import { cx } from '@/utils/classNames';
import { NAV_ITEMS } from '../navigation';
import styles from './BottomNav.module.css';

const BOTTOM_ITEMS = NAV_ITEMS.filter((item) => item.inBottomNav);

export function BottomNav() {
  return (
    <nav aria-label="Main" className={styles.bar}>
      <ul role="list" className={styles.list}>
        {BOTTOM_ITEMS.map(({ to, shortLabel, icon: Icon }) => (
          <li key={to} className={styles.item}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) => cx(styles.link, isActive && styles.active)}
            >
              <span className={styles.iconWrap}>
                <Icon aria-hidden size={22} strokeWidth={1.75} />
              </span>
              <span className={styles.label}>{shortLabel}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
