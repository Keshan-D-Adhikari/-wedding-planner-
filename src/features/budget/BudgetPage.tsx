import { lazy, Suspense, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Sparkles, Wallet } from 'lucide-react';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { PageLoader } from '@/components/PageLoader';
import { addBudgetItems } from '@/db/budget';
import { db } from '@/db/db';
import { useWedding } from '@/hooks/useWedding';
import type { BudgetItem } from '@/types';
import { BudgetItemDialog, type BudgetDialogConfig } from './BudgetItemDialog';
import { BudgetItemList } from './BudgetItemList';
import styles from './BudgetPage.module.css';
import { BudgetSummary } from './BudgetSummary';
import { computeTotals, summarizeByCategory } from './budgetUtils';
import { buildSuggestedItems } from './suggestedItems';
import { TotalBudgetDialog } from './TotalBudgetDialog';

const BudgetCharts = lazy(() => import('./BudgetCharts'));

export default function BudgetPage() {
  const { wedding } = useWedding();
  const items = useLiveQuery(() => db.budgetItems.toArray());

  // Dialogs keep their last config while animating closed; the key resets their form.
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [itemDialogConfig, setItemDialogConfig] = useState<BudgetDialogConfig>({ mode: 'add' });
  const [itemDialogKey, setItemDialogKey] = useState(0);
  const [totalDialogOpen, setTotalDialogOpen] = useState(false);
  const [totalDialogKey, setTotalDialogKey] = useState(0);

  const groups = useMemo(() => summarizeByCategory(items ?? []), [items]);

  if (!wedding || !items) return <PageLoader />;

  const totals = computeTotals(items, wedding.totalBudget);
  const { currency } = wedding;

  function openItemDialog(config: BudgetDialogConfig) {
    setItemDialogConfig(config);
    setItemDialogKey((k) => k + 1);
    setItemDialogOpen(true);
  }

  function openTotalDialog() {
    setTotalDialogKey((k) => k + 1);
    setTotalDialogOpen(true);
  }

  const addButton = (
    <Button icon={<Plus aria-hidden />} onClick={() => openItemDialog({ mode: 'add' })}>
      Add item
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Budget"
        subtitle="Know exactly where every rupee, dollar or pound goes."
        actions={addButton}
      />

      <div className={styles.layout}>
        <BudgetSummary totals={totals} currency={currency} onEditBudget={openTotalDialog} />

        {items.length === 0 ? (
          <EmptyState
            icon={<Wallet aria-hidden />}
            title="No budget items yet"
            message={
              wedding.totalBudget > 0
                ? 'Start with a typical split of your budget across 12 categories — you can change every number.'
                : 'Add your first cost, or start with a list of typical wedding expenses.'
            }
            action={
              <div className={styles.emptyActions}>
                <Button
                  icon={<Sparkles aria-hidden />}
                  onClick={() => void addBudgetItems(buildSuggestedItems(wedding.totalBudget))}
                >
                  Start with suggested items
                </Button>
                <Button variant="secondary" onClick={() => openItemDialog({ mode: 'add' })}>
                  Add my own
                </Button>
              </div>
            }
          />
        ) : (
          <>
            <Suspense fallback={<div className={styles.chartsPlaceholder} aria-hidden />}>
              <BudgetCharts groups={groups} currency={currency} />
            </Suspense>

            <section aria-labelledby="items-heading">
              <h2 id="items-heading" className={styles.sectionTitle}>
                Your items
              </h2>
              <BudgetItemList
                groups={groups}
                currency={currency}
                onEdit={(item: BudgetItem) => openItemDialog({ mode: 'edit', item })}
                onAdd={(category: string) => openItemDialog({ mode: 'add', category })}
              />
            </section>
          </>
        )}
      </div>

      <BudgetItemDialog
        key={`item-${itemDialogKey}`}
        open={itemDialogOpen}
        onOpenChange={setItemDialogOpen}
        config={itemDialogConfig}
        currency={currency}
      />
      <TotalBudgetDialog
        key={`total-${totalDialogKey}`}
        open={totalDialogOpen}
        onOpenChange={setTotalDialogOpen}
        wedding={wedding}
      />
    </>
  );
}
