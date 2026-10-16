import { ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router';
import { BrandMark } from '@/components/BrandMark';
import { cx } from '@/utils/classNames';
import { PRIVACY_NOTE } from '@/utils/constants';
import { NAV_ITEMS } from '../navigation';
import styles from './Sidebar.module.css';

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <BrandMark />
      </div>

      <nav aria-label="Main">
        <ul role="list" className={styles.list}>
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                className={({ isActive }) => cx(styles.link, isActive && styles.active)}
              >
                <Icon aria-hidden size={20} strokeWidth={1.75} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <p className={styles.privacy}>
        <ShieldCheck aria-hidden size={16} />
        <span>{PRIVACY_NOTE}</span>
      </p>
    </aside>
  );
}
