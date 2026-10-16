import { ChevronDown } from 'lucide-react';
import { setGuestRsvp } from '@/db/guests';
import type { Guest } from '@/types';
import { isOneOf } from '@/utils/guards';
import { RSVP_OPTIONS, RSVP_VALUES } from './guestUtils';
import styles from './RsvpSelect.module.css';

/**
 * Change a guest's RSVP straight from the list. A native select, so phones show
 * their own picker. The status is always written out — never colour alone.
 */
export function RsvpSelect({ guest }: { guest: Guest }) {
  return (
    <span className={styles.wrap} data-status={guest.rsvp}>
      <select
        className={styles.select}
        value={guest.rsvp}
        aria-label={`RSVP for ${guest.name}`}
        onChange={(e) => {
          const value = e.target.value;
          if (isOneOf(RSVP_VALUES, value)) void setGuestRsvp(guest.id, value);
        }}
      >
        {RSVP_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden size={14} className={styles.chevron} />
    </span>
  );
}
