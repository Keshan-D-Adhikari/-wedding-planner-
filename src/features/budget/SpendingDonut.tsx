import { useMemo } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipContentProps } from 'recharts';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { CurrencyCode } from '@/types';
import { formatCurrency } from '@/utils/currency';
import styles from './BudgetCharts.module.css';
import type { CategorySummary } from './budgetUtils';
import { CATEGORY_COLORS, MAX_SLICES, OTHER_COLOR } from './chartColors';

interface Slice {
  name: string;
  value: number;
  fill: string;
  percent: number;
}

const OTHER = 'Other';

/**
 * Up to 6 named slices; anything beyond folds into a neutral "Other" slice
 * (a 7th colour would no longer be distinguishable). The user's own "Other"
 * category always joins that slice, so "Other" never appears twice.
 */
function buildSlices(groups: CategorySummary[], useActual: boolean): Slice[] {
  const all = groups
    .map((g) => ({ name: g.category, value: useActual ? g.actual : g.projected }))
    .filter((v) => v.value > 0);
  const values = all.filter((v) => v.name !== OTHER).sort((a, b) => b.value - a.value);
  const otherCategory = all.filter((v) => v.name === OTHER);

  const total = all.reduce((sum, v) => sum + v.value, 0);
  const slotsForNamed = otherCategory.length > 0 ? MAX_SLICES : CATEGORY_COLORS.length;
  const fitsAll = values.length <= slotsForNamed;
  const named = fitsAll ? values : values.slice(0, MAX_SLICES);
  const rest = [...(fitsAll ? [] : values.slice(MAX_SLICES)), ...otherCategory];

  const slices: Slice[] = named.map((v, index) => ({
    ...v,
    fill: CATEGORY_COLORS[index] ?? OTHER_COLOR,
    percent: total > 0 ? (v.value / total) * 100 : 0,
  }));

  if (rest.length > 0) {
    const value = rest.reduce((sum, v) => sum + v.value, 0);
    slices.push({ name: OTHER, value, fill: OTHER_COLOR, percent: (value / total) * 100 });
  }
  return slices;
}

function DonutTooltip({
  active,
  payload,
  currency,
}: TooltipContentProps & { currency: CurrencyCode }) {
  const entry = payload[0];
  if (!active || !entry) return null;
  const slice = entry.payload as Slice;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipTitle}>
        <span className={styles.swatch} style={{ background: slice.fill }} aria-hidden />
        {slice.name}
      </span>
      <span className={styles.tooltipValue}>
        {formatCurrency(slice.value, currency)} · {Math.round(slice.percent)}%
      </span>
    </div>
  );
}

interface SpendingDonutProps {
  groups: CategorySummary[];
  currency: CurrencyCode;
}

export function SpendingDonut({ groups, currency }: SpendingDonutProps) {
  const reducedMotion = useReducedMotion();
  // Show real spending once any actual costs exist; before that, show the plan.
  const useActual = groups.some((g) => g.actual > 0);
  const slices = useMemo(() => buildSlices(groups, useActual), [groups, useActual]);
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const title = useActual ? 'Spending by category' : 'Planned spending by category';

  return (
    <figure className={styles.chartCard}>
      <figcaption className={styles.chartTitle}>{title}</figcaption>

      {slices.length === 0 ? (
        <p className={styles.noData}>Add amounts to your items to see this chart.</p>
      ) : (
        <div className={styles.donutLayout}>
          <div className={styles.donutWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="64%"
                  outerRadius="100%"
                  cornerRadius={4}
                  stroke="#ffffff"
                  strokeWidth={slices.length > 1 ? 2 : 0}
                  isAnimationActive={!reducedMotion}
                />
                <Tooltip
                  content={(props) => <DonutTooltip {...props} currency={currency} />}
                  isAnimationActive={false}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenter} aria-hidden>
              <span className={styles.donutTotal}>{formatCurrency(total, currency)}</span>
              <span className={styles.donutLabel}>{useActual ? 'spent' : 'planned'}</span>
            </div>
          </div>

          {/* The legend doubles as the accessible data table: name, amount and share. */}
          <table className={styles.legendTable}>
            <caption className="visually-hidden">{title}</caption>
            <thead className="visually-hidden">
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Amount</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {slices.map((slice) => (
                <tr key={slice.name}>
                  <th scope="row">
                    <span
                      className={styles.swatch}
                      style={{ background: slice.fill }}
                      aria-hidden
                    />
                    {slice.name}
                  </th>
                  <td>{formatCurrency(slice.value, currency)}</td>
                  <td className={styles.percent}>{Math.round(slice.percent)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
