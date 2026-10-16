import { CircleAlert, PartyPopper } from 'lucide-react';
import { ProgressRing } from '@/components/ProgressRing';
import styles from './ChecklistSummary.module.css';

interface ChecklistSummaryProps {
  total: number;
  done: number;
  overdue: number;
  onShowOverdue: () => void;
}

export function ChecklistSummary({ total, done, overdue, onShowOverdue }: ChecklistSummaryProps) {
  const percent = total > 0 ? (done / total) * 100 : 0;
  const allDone = total > 0 && done === total;

  return (
    <div className={styles.summary}>
      <ProgressRing
        value={percent}
        size={88}
        label="Checklist progress"
        tone={allDone ? 'success' : 'primary'}
      />
      <div className={styles.text}>
        <p className={styles.headline}>
          {allDone ? (
            <>
              <PartyPopper aria-hidden size={20} /> Everything's done!
            </>
          ) : (
            `${done} of ${total} tasks done`
          )}
        </p>
        <p className={styles.sub}>
          {allDone
            ? 'Time to relax and enjoy it.'
            : `${total - done} still to go — one step at a time.`}
        </p>
        {overdue > 0 && (
          <button type="button" className={styles.overdue} onClick={onShowOverdue}>
            <CircleAlert aria-hidden size={14} />
            {overdue} overdue
          </button>
        )}
      </div>
    </div>
  );
}
