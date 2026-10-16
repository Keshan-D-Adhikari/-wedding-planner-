import type { Ref } from 'react';
import { CATEGORY_COLORS, OTHER_COLOR } from '@/features/budget/chartColors';
import { computeTotals, summarizeByCategory } from '@/features/budget/budgetUtils';
import type { BudgetItem, Wedding } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { CardFrame, CoupleNames } from './CardFrame';
import styles from './cards.module.css';

const MAX_BARS = 5;

interface BudgetCardProps {
  wedding: Wedding;
  items: BudgetItem[];
  /** Show percentages only — for people who'd rather not post real numbers. */
  hideAmounts: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function BudgetCard({ wedding, items, hideAmounts, ref }: BudgetCardProps) {
  const money = (amount: number) => formatCurrency(amount, wedding.currency);
  const totals = computeTotals(items, wedding.totalBudget);
  const groups = summarizeByCategory(items)
    .filter((g) => g.projected > 0)
    .sort((a, b) => b.projected - a.projected);

  const shown = groups.slice(0, MAX_BARS);
  const restTotal = groups.slice(MAX_BARS).reduce((sum, g) => sum + g.projected, 0);
  const bars = [
    ...shown.map((g, i) => ({
      name: g.category,
      value: g.projected,
      color: CATEGORY_COLORS[i] ?? OTHER_COLOR,
    })),
    ...(restTotal > 0 ? [{ name: 'Everything else', value: restTotal, color: OTHER_COLOR }] : []),
  ];
  const largest = Math.max(1, ...bars.map((b) => b.value));
  const base = totals.projected || 1;

  const hasBudget = totals.totalBudget > 0;
  const usedPercent = hasBudget ? Math.round((totals.projected / totals.totalBudget) * 100) : 0;
  const paidPercent = totals.projected > 0 ? Math.round((totals.paid / totals.projected) * 100) : 0;

  return (
    <CardFrame eyebrow="Our wedding budget" ref={ref}>
      <CoupleNames first={wedding.partner1Name} second={wedding.partner2Name} size={72} />

      <p className={styles.budgetBig}>
        {hideAmounts
          ? `${hasBudget ? usedPercent : paidPercent}%`
          : money(hasBudget ? totals.totalBudget : totals.projected)}
      </p>
      <p className={styles.bigLabel}>
        {hideAmounts
          ? hasBudget
            ? 'of our budget planned'
            : 'paid so far'
          : hasBudget
            ? totals.isOverBudget
              ? `${money(-totals.remaining)} over — time to trim!`
              : `${money(totals.remaining)} still to plan`
            : 'planned so far'}
      </p>

      {bars.length > 0 && (
        <ul className={styles.bars}>
          {bars.map((bar) => (
            <li key={bar.name}>
              <span className={styles.barText}>
                <span>{bar.name}</span>
                <span className={styles.barValue}>
                  {hideAmounts ? `${Math.round((bar.value / base) * 100)}%` : money(bar.value)}
                </span>
              </span>
              <span className={styles.barTrack}>
                <span
                  className={styles.barFill}
                  style={{ width: `${(bar.value / largest) * 100}%`, background: bar.color }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.budgetStats}>
        <div>
          <span className={styles.statValue}>
            {hideAmounts ? groups.length : money(totals.projected)}
          </span>
          <span className={styles.statLabel}>{hideAmounts ? 'Categories' : 'Planned'}</span>
        </div>
        <div>
          <span className={styles.statValue}>
            {hideAmounts ? `${paidPercent}%` : money(totals.paid)}
          </span>
          <span className={styles.statLabel}>Paid</span>
        </div>
      </div>
    </CardFrame>
  );
}
