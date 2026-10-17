import { useId } from 'react';
import type { WeddingEvent } from '@/types';
import styles from './EventInviteField.module.css';

interface EventInviteFieldProps {
  events: WeddingEvent[];
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

/** "Invited to" checkboxes — one per event, shown only when the couple has set up events. */
export function EventInviteField({ events, selected, onChange, error }: EventInviteFieldProps) {
  const errorId = useId();

  function toggle(id: string, checked: boolean) {
    onChange(checked ? [...selected, id] : selected.filter((existing) => existing !== id));
  }

  return (
    <fieldset className={styles.field} aria-describedby={error ? errorId : undefined}>
      <legend className={styles.legend}>Invited to</legend>
      <div className={styles.options}>
        {events.map((event) => (
          <label key={event.id} className={styles.option}>
            <input
              type="checkbox"
              className={styles.input}
              checked={selected.includes(event.id)}
              onChange={(e) => toggle(event.id, e.target.checked)}
            />
            <span className={styles.pill}>{event.name}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
