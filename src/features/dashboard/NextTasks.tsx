import { useState } from 'react';
import { PartyPopper } from 'lucide-react';
import { LinkButton } from '@/components/Button';
import { Card } from '@/components/Card';
import { CheckCircle } from '@/components/CheckCircle';
import { setTaskCompleted } from '@/db/tasks';
import type { ChecklistTask } from '@/types';
import { cx } from '@/utils/classNames';
import { daysUntil, formatDate } from '@/utils/date';
import styles from './NextTasks.module.css';

/** How long the tick animation plays before the task leaves the list. */
const COMPLETE_DELAY_MS = 450;

function dueText(dueDate: string | undefined): { text: string; overdue: boolean } {
  if (!dueDate) return { text: 'No due date', overdue: false };
  const days = daysUntil(dueDate) ?? 0;
  if (days < 0) return { text: `Overdue · ${formatDate(dueDate, 'd MMM')}`, overdue: true };
  if (days === 0) return { text: 'Due today', overdue: false };
  if (days === 1) return { text: 'Due tomorrow', overdue: false };
  return { text: `Due ${formatDate(dueDate, 'd MMM yyyy')}`, overdue: false };
}

export function NextTasks({ tasks }: { tasks: ChecklistTask[] }) {
  const [completing, setCompleting] = useState<ReadonlySet<string>>(new Set());

  function handleComplete(id: string) {
    setCompleting((prev) => new Set(prev).add(id));
    window.setTimeout(() => void setTaskCompleted(id, true), COMPLETE_DELAY_MS);
  }

  return (
    <Card as="section" aria-labelledby="next-tasks-heading">
      <div className={styles.header}>
        <h2 id="next-tasks-heading" className={styles.title}>
          Up next
        </h2>
        <LinkButton to="/checklist" variant="ghost" size="sm">
          See all
        </LinkButton>
      </div>

      {tasks.length === 0 ? (
        <div className={styles.empty}>
          <PartyPopper aria-hidden size={28} />
          <p>You're all caught up. Enjoy this moment!</p>
        </div>
      ) : (
        <ul role="list" className={styles.list}>
          {tasks.map((task) => {
            const isDone = completing.has(task.id);
            const due = dueText(task.dueDate);
            return (
              <li key={task.id} className={cx(styles.item, isDone && styles.done)}>
                <label className={styles.row}>
                  <CheckCircle
                    checked={isDone}
                    disabled={isDone}
                    onChange={() => handleComplete(task.id)}
                  />
                  <span className={styles.text}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.meta}>
                      <span className={styles.chip}>{task.category}</span>
                      <span className={cx(due.overdue && styles.overdue)}>{due.text}</span>
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
