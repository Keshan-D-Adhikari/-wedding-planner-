import { Leaf, Mail, Phone, UtensilsCrossed } from 'lucide-react';
import type { Guest } from '@/types';
import styles from './GuestList.module.css';
import { sideLabel, type Partners } from './guestUtils';
import { RsvpSelect } from './RsvpSelect';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.charAt(0) ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.charAt(0) ?? '') : '';
  return (first + last).toUpperCase();
}

interface GuestListProps {
  guests: Guest[];
  partners: Partners;
  onEdit: (guest: Guest) => void;
}

export function GuestList({ guests, partners, onEdit }: GuestListProps) {
  return (
    <ul role="list" className={styles.list}>
      {guests.map((guest) => (
        <li key={guest.id} className={styles.item}>
          <button type="button" className={styles.body} onClick={() => onEdit(guest)}>
            <span className={styles.avatar} aria-hidden>
              {initials(guest.name)}
            </span>
            <span className={styles.text}>
              <span className={styles.name}>
                <span className="visually-hidden">Edit </span>
                {guest.name}
                {guest.plusOne && (
                  <span className={styles.plusOne} title="Bringing a plus-one">
                    +1
                  </span>
                )}
              </span>
              <span className={styles.meta}>
                <span className={styles.chip}>{sideLabel(guest.side, partners, true)}</span>
                {guest.group && <span>{guest.group}</span>}
                {guest.mealChoice && (
                  <span className={styles.detail}>
                    <UtensilsCrossed aria-hidden size={12} />
                    {guest.mealChoice}
                  </span>
                )}
                {guest.dietary && (
                  <span className={styles.detail}>
                    <Leaf aria-hidden size={12} />
                    {guest.dietary}
                  </span>
                )}
                {guest.phone && (
                  <span className={styles.detail}>
                    <Phone aria-hidden size={12} />
                    <span className="visually-hidden">Has phone number</span>
                  </span>
                )}
                {guest.email && (
                  <span className={styles.detail}>
                    <Mail aria-hidden size={12} />
                    <span className="visually-hidden">Has email</span>
                  </span>
                )}
              </span>
            </span>
          </button>
          <RsvpSelect guest={guest} />
        </li>
      ))}
    </ul>
  );
}
