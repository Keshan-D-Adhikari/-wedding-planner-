import type { CurrencyCode } from '@/types';
import styles from './BudgetPage.module.css';
import type { CategorySummary } from './budgetUtils';
import { EstimateVsActualChart } from './EstimateVsActualChart';
import { SpendingDonut } from './SpendingDonut';

interface BudgetChartsProps {
  groups: CategorySummary[];
  currency: CurrencyCode;
}

/** Lazy-loaded by BudgetPage: Recharts is large, so it shouldn't delay the list. */
export default function BudgetCharts({ groups, currency }: BudgetChartsProps) {
  return (
    <div className={styles.charts}>
      <SpendingDonut groups={groups} currency={currency} />
      <EstimateVsActualChart groups={groups} currency={currency} />
    </div>
  );
}
