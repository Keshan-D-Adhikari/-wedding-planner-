import { CircleAlert, CircleCheck, Pencil } from 'lucide-react';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import type { CurrencyCode } from '@/types';
import { cx } from '@/utils/classNames';
import { formatCurrency } from '@/utils/currency';
import type { BudgetTotals } from './budgetUtils';
import styles from './BudgetSummary.module.css';

interface BudgetSummaryProps {
  totals: BudgetTotals;
  currency: CurrencyCode;
  onEditBudget: () => void;
}

export function BudgetSummary({ totals, currency, onEditBudget }: BudgetSummaryProps) {
  const money = (amount: number) => formatCurrency(amount, currency);
  const hasBudget = totals.totalBudget > 0;
  const usedPercent = hasBudget ? (totals.projected / totals.totalBudget) * 100 : 0;
  const tone = totals.isOverBudget ? 'danger' : usedPercent > 90 ? 'warning' : 'primary';

  return (
    <section className={styles.summary} aria-label="Budget summary">
      <div className={styles.hero}>
        {hasBudget ? (
          <>
            <p className={styles.eyebrow}>
              {totals.isOverBudget ? 'Over budget by' : 'Left in your budget'}
            </p>
            <p className={cx(styles.big, totals.isOverBudget && styles.danger)}>
              {money(Math.abs(totals.remaining))}
            </p>
            <ProgressBar
              value={usedPercent}
              label="Share of budget planned"
              tone={tone}
              className={styles.bar}
            />
            <p className={styles.caption}>
              {money(totals.projected)} planned of {money(totals.totalBudget)}
            </p>
            {totals.isOverBudget ? (
              <p className={cx(styles.status, styles.statusDanger)} role="status">
                <CircleAlert aria-hidden size={16} />
                Your planned costs are higher than your budget. Trim an item or raise the budget.
              </p>
            ) : (
              usedPercent > 90 && (
                <p className={cx(styles.status, styles.statusWarning)} role="status">
                  <CircleAlert aria-hidden size={16} />
                  {totals.remaining === 0
                    ? 'Your whole budget is planned — any extra costs will go over.'
                    : "You've planned over 90% of your budget."}
                </p>
              )
            )}
          </>
        ) : (
          <>
            <p className={styles.eyebrow}>Total budget</p>
            <p className={styles.big}>Not set yet</p>
            <p className={styles.caption}>Set a total so we can tell you what's left.</p>
          </>
        )}
        <Button
          variant="secondary"
          size="sm"
          icon={<Pencil aria-hidden />}
          onClick={onEditBudget}
          className={styles.edit}
        >
          {hasBudget ? 'Edit total' : 'Set total budget'}
        </Button>
      </div>

      <dl className={styles.stats}>
        <div className={styles.stat}>
          <dt>Total budget</dt>
          <dd>{money(totals.totalBudget)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Estimated</dt>
          <dd>{money(totals.estimated)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Actual</dt>
          <dd>{money(totals.actual)}</dd>
        </div>
        <div className={styles.stat}>
          <dt>Paid</dt>
          <dd>{money(totals.paid)}</dd>
        </div>
        <div className={cx(styles.stat, styles.wide)}>
          <dt>Still to pay</dt>
          <dd>
            {totals.outstanding === 0 && totals.paid > 0 ? (
              <span className={styles.allPaid}>
                <CircleCheck aria-hidden size={16} /> All paid
              </span>
            ) : (
              money(totals.outstanding)
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
