import { useState } from 'react';
import { Button } from '@/components/Button';
import form from '@/components/FormLayout.module.css';
import { Modal } from '@/components/Modal';
import { addTaskPack } from '@/db/tasks';
import { countPackTasks, TASK_PACKS, type TaskPack } from '@/db/seed/taskPacks';
import styles from './TaskPackDialog.module.css';

interface TaskPackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weddingDate: string;
  /** Called after tasks are added, so the page can show a confirmation */
  onAdded: (message: string) => void;
}

/** Offers extra tasks for traditional weddings. Safe to add twice: duplicates are skipped. */
export function TaskPackDialog({ open, onOpenChange, weddingDate, onAdded }: TaskPackDialogProps) {
  const [busyId, setBusyId] = useState<TaskPack['id'] | null>(null);

  async function handleAdd(pack: TaskPack) {
    setBusyId(pack.id);
    try {
      const added = await addTaskPack(pack.id, weddingDate);
      onOpenChange(false);
      onAdded(
        added === 0
          ? `Those ${pack.label} tasks are already on your list.`
          : `${added} ${pack.label} tasks added to your checklist.`,
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Traditional wedding tasks"
      description="Extra tasks to add on top of your checklist. Every one can be edited or deleted."
    >
      <div className={form.form}>
        <ul role="list" className={styles.list}>
          {TASK_PACKS.map((pack) => (
            <li key={pack.id} className={styles.item}>
              <div className={styles.text}>
                <h3 className={styles.name}>{pack.label}</h3>
                <p className={styles.description}>{pack.description}</p>
                <p className={styles.count}>{countPackTasks(pack)} tasks</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={busyId !== null}
                onClick={() => void handleAdd(pack)}
                aria-label={`Add ${pack.label} tasks`}
              >
                {busyId === pack.id ? 'Adding…' : 'Add'}
              </Button>
            </li>
          ))}
        </ul>
        <p className={form.hint}>
          Customs differ between families and regions, so use these as reminders and confirm details
          with your elders, priest or astrologer.
        </p>
      </div>
    </Modal>
  );
}
