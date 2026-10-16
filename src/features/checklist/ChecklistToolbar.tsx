import { SegmentedControl } from '@/components/SegmentedControl';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';
import { TASK_CATEGORIES, type TaskCategory } from '@/types';
import type { ChecklistFilters, StatusFilter } from './checklistUtils';
import styles from './ChecklistToolbar.module.css';

const STATUS_OPTIONS: readonly { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'To do' },
  { value: 'done', label: 'Done' },
];

function isCategoryFilter(value: string): value is TaskCategory | 'all' {
  return value === 'all' || (TASK_CATEGORIES as readonly string[]).includes(value);
}

interface ChecklistToolbarProps {
  filters: ChecklistFilters;
  onChange: (patch: Partial<ChecklistFilters>) => void;
}

export function ChecklistToolbar({ filters, onChange }: ChecklistToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <SegmentedControl
        label="Show tasks"
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(status) => onChange({ status })}
        className={styles.status}
      />
      <div className={styles.row}>
        <TextField
          type="search"
          label="Search tasks"
          hideLabel
          placeholder="Search tasks…"
          value={filters.query}
          onChange={(e) => onChange({ query: e.target.value })}
          className={styles.search}
        />
        <SelectField
          label="Filter by category"
          hideLabel
          value={filters.category}
          onChange={(e) => {
            if (isCategoryFilter(e.target.value)) onChange({ category: e.target.value });
          }}
          className={styles.category}
        >
          <option value="all">All categories</option>
          {TASK_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </SelectField>
      </div>
    </div>
  );
}
