import { useId } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import type { ChecklistTask, Timeframe } from '@/types';
import { cx } from '@/utils/classNames';
import type { TimeframeGroup } from './checklistUtils';
import { TaskItem } from './TaskItem';
import styles from './TimeframeSection.module.css';
import { TIMEFRAME_LABELS } from './timeframeLabels';

interface TimeframeSectionProps {
  group: TimeframeGroup;
  collapsed: boolean;
  onToggle: (timeframe: Timeframe) => void;
  onEdit: (task: ChecklistTask) => void;
  onAdd: (timeframe: Timeframe) => void;
}

export function TimeframeSection({
  group,
  collapsed,
  onToggle,
  onEdit,
  onAdd,
}: TimeframeSectionProps) {
  const bodyId = useId();
  const { timeframe, tasks, total, done } = group;
  const label = TIMEFRAME_LABELS[timeframe];
  const complete = total > 0 && done === total;

  return (
    <section className={cx(styles.section, complete && styles.complete)}>
      <h2 className={styles.heading}>
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={!collapsed}
          aria-controls={bodyId}
          onClick={() => onToggle(timeframe)}
        >
          <span className={styles.labelWrap}>
            <span className={styles.label}>{label}</span>
            <span className={styles.count}>
              {done} of {total} done
            </span>
          </span>
          <ChevronDown aria-hidden size={20} className={styles.chevron} />
        </button>
      </h2>
      <ProgressBar
        value={total > 0 ? (done / total) * 100 : 0}
        label={`${label} progress`}
        tone={complete ? 'success' : 'primary'}
        className={styles.progress}
      />

      {/* `inert` hides collapsed tasks from keyboard and screen readers while still animating */}
      <div id={bodyId} className={styles.collapse} data-collapsed={collapsed} inert={collapsed}>
        <div className={styles.inner}>
          <ul role="list" className={styles.list}>
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={onEdit} />
            ))}
          </ul>
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus aria-hidden />}
            onClick={() => onAdd(timeframe)}
            className={styles.add}
          >
            Add a task here
          </Button>
        </div>
      </div>
    </section>
  );
}
