import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ListChecks, Plus, SearchX, Sparkles } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { Toast } from '@/components/Toast';
import { db } from '@/db/db';
import { useToast } from '@/hooks/useToast';
import { useWedding } from '@/hooks/useWedding';
import type { ChecklistTask, Timeframe } from '@/types';
import { isTaskOverdue } from '@/utils/tasks';
import styles from './ChecklistPage.module.css';
import { ChecklistSummary } from './ChecklistSummary';
import { ChecklistToolbar } from './ChecklistToolbar';
import {
  DEFAULT_FILTERS,
  filterTasks,
  groupByTimeframe,
  isFiltering,
  type ChecklistFilters,
} from './checklistUtils';
import { TaskFormDialog, type TaskDialogConfig } from './TaskFormDialog';
import { TaskPackDialog } from './TaskPackDialog';
import { TimeframeSection } from './TimeframeSection';
import { useCollapsedTimeframes } from './useCollapsedTimeframes';

export default function ChecklistPage() {
  const { wedding } = useWedding();
  const toast = useToast();
  const tasks = useLiveQuery(() => db.tasks.toArray());
  const [packOpen, setPackOpen] = useState(false);
  const [filters, setFilters] = useState<ChecklistFilters>(DEFAULT_FILTERS);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const { collapsed, toggle } = useCollapsedTimeframes();

  // The dialog keeps its last config while it animates closed; `dialogKey` resets the form.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<TaskDialogConfig>({ mode: 'add' });
  const [dialogKey, setDialogKey] = useState(0);

  const groups = useMemo(() => {
    if (!tasks) return [];
    let visible = filterTasks(tasks, filters);
    if (showOverdueOnly) visible = visible.filter(isTaskOverdue);
    return groupByTimeframe(tasks, visible);
  }, [tasks, filters, showOverdueOnly]);

  if (!tasks || !wedding) return <PageLoader />;

  const done = tasks.filter((t) => t.completed).length;
  const overdue = tasks.filter(isTaskOverdue).length;
  const filtering = isFiltering(filters) || showOverdueOnly;

  function openDialog(config: TaskDialogConfig) {
    setDialogConfig(config);
    setDialogKey((k) => k + 1);
    setDialogOpen(true);
  }

  function updateFilters(patch: Partial<ChecklistFilters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
    setShowOverdueOnly(false);
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS);
    setShowOverdueOnly(false);
  }

  return (
    <>
      <PageHeader
        title="Checklist"
        subtitle="Every task, from engagement to the big day."
        actions={
          <>
            <Button icon={<Plus aria-hidden />} onClick={() => openDialog({ mode: 'add' })}>
              Add task
            </Button>
            <Button
              variant="secondary"
              icon={<Sparkles aria-hidden />}
              onClick={() => setPackOpen(true)}
            >
              Traditional tasks
            </Button>
          </>
        }
      />

      {tasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks aria-hidden />}
          title="Your checklist is empty"
          message="Add your first task and start ticking things off."
          action={
            <Button icon={<Plus aria-hidden />} onClick={() => openDialog({ mode: 'add' })}>
              Add a task
            </Button>
          }
        />
      ) : (
        <div className={styles.layout}>
          <ChecklistSummary
            total={tasks.length}
            done={done}
            overdue={overdue}
            onShowOverdue={() => {
              setFilters(DEFAULT_FILTERS);
              setShowOverdueOnly(true);
            }}
          />

          <ChecklistToolbar filters={filters} onChange={updateFilters} />

          {filtering && (
            <p className={styles.filterNote} role="status">
              {showOverdueOnly ? 'Showing overdue tasks only.' : 'Filters are on.'}{' '}
              <button type="button" className={styles.clear} onClick={clearFilters}>
                Show everything
              </button>
            </p>
          )}

          {groups.length === 0 ? (
            <EmptyState
              icon={<SearchX aria-hidden />}
              title="No tasks match"
              message="Try a different search or filter."
              action={
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className={styles.sections}>
              {groups.map((group) => (
                <TimeframeSection
                  key={group.timeframe}
                  group={group}
                  // While filtering, show every matching section open.
                  collapsed={!filtering && collapsed.has(group.timeframe)}
                  onToggle={toggle}
                  onEdit={(task: ChecklistTask) => openDialog({ mode: 'edit', task })}
                  onAdd={(timeframe: Timeframe) => openDialog({ mode: 'add', timeframe })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <TaskFormDialog
        key={dialogKey}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={dialogConfig}
      />
      <TaskPackDialog
        open={packOpen}
        onOpenChange={setPackOpen}
        weddingDate={wedding.weddingDate}
        onAdded={toast.show}
      />
      <Toast message={toast.message} onDismiss={toast.dismiss} />
    </>
  );
}
