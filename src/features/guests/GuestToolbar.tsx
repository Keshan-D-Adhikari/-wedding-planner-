import { SegmentedControl } from '@/components/SegmentedControl';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import type { RsvpStatus } from '@/types';
import { isOneOf } from '@/utils/guards';
import styles from './GuestToolbar.module.css';
import { SIDE_VALUES, sideLabel, type GuestFilters, type Partners } from './guestUtils';

const RSVP_FILTERS: readonly { value: RsvpStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'attending', label: 'Attending' },
  { value: 'pending', label: 'Pending' },
  { value: 'declined', label: 'Declined' },
];

interface GuestToolbarProps {
  filters: GuestFilters;
  onChange: (patch: Partial<GuestFilters>) => void;
  partners: Partners;
  groups: string[];
}

export function GuestToolbar({ filters, onChange, partners, groups }: GuestToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <TextField
        type="search"
        label="Search guests"
        hideLabel
        placeholder="Search by name, group, email…"
        value={filters.query}
        onChange={(e) => onChange({ query: e.target.value })}
        className={styles.search}
      />
      <div className={styles.selects}>
        <SelectField
          label="Filter by side"
          hideLabel
          value={filters.side}
          onChange={(e) => {
            const value = e.target.value;
            if (value === 'all' || isOneOf(SIDE_VALUES, value)) onChange({ side: value });
          }}
        >
          <option value="all">All sides</option>
          {SIDE_VALUES.map((side) => (
            <option key={side} value={side}>
              {sideLabel(side, partners)}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Filter by group"
          hideLabel
          value={filters.group}
          onChange={(e) => onChange({ group: e.target.value })}
        >
          <option value="all">All groups</option>
          {groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </SelectField>
      </div>
      <SegmentedControl
        label="Filter by RSVP"
        options={RSVP_FILTERS}
        value={filters.rsvp}
        onChange={(rsvp) => onChange({ rsvp })}
        className={styles.rsvp}
      />
    </div>
  );
}
