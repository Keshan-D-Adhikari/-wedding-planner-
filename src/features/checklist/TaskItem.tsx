import { useState } from 'react';
import { ChevronRight, StickyNote } from 'lucide-react';
import { CheckCircle } from '@/components/CheckCircle';
import { setTaskCompleted } from '@/db/tasks';
import type { ChecklistTask } from '@/types';
import { cx } from '@/utils/classNames';
import { daysUntil, formatDate } from '@/utils/date';
import styles from './TaskItem.module.css';

/** Lets the tick animation play before the list re-sorts or filters the task away. */
const SAVE_DELAY_MS = 350;

function dueLabel(task: ChecklistTask, checked: boolean): { text: string; overdue: boolean } {
  if (!task.dueDate) return { text: '', overdue: false };
  const days = daysUntil(task.dueDate) ?? 0;
  const date = formatDate(task.dueDate, 'd MMM yyyy');
  if (checked) return { text: date, overdue: false };
  if (days < 0) return { text: `Overdue · ${date}`, overdue: true };
  if (days === 0) return { text: 'Due today', overdue: false };
  if (days === 1) return { text: 'Due tomorrow', overdue: false };
  return { text: date, overdue: false };
}

interface TaskItemProps {
  task: ChecklistTask;
  onEdit: (task: ChecklistTask) => void;
}

export function TaskItem({ task, onEdit }: TaskItemProps) {
  // Optimistic value: the checkbox reacts instantly, the database write follows.
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const checked = optimistic ?? task.completed;
  const due = dueLabel(task, checked);

  function handleToggle() {
    const next = !checked;
    setOptimistic(next);
    window.setTimeout(() => {
      void setTaskCompleted(task.id, next).finally(() => setOptimistic(null));
    }, SAVE_DELAY_MS);
  }

  return (
    <li className={cx(styles.item, checked && styles.done, due.overdue && styles.overdue)}>
      <CheckCircle
        checked={checked}
        onChange={handleToggle}
        aria-label={`${task.title}: mark as ${checked ? 'not done' : 'done'}`}
      />

      <button type="button" className={styles.body} onClick={() => onEdit(task)}>
        <span className="visually-hidden">Edit task: </span>
        <span className={styles.title}>{task.title}</span>
        {task.notes && (
          <span className={styles.notes}>
            <StickyNote aria-hidden size={12} />
            <span>{task.notes}</span>
          </span>
        )}
        <span className={styles.meta}>
          <span className={styles.chip}>{task.category}</span>
          {due.text && <span className={styles.due}>{due.text}</span>}
        </span>
      </button>

      <ChevronRight aria-hidden size={18} className={styles.chevron} />
    </li>
  );
}
