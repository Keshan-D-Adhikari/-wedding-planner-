import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts';
import { useCssVars } from '@/hooks/useCssVars';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { CurrencyCode } from '@/types';
import { formatCurrency, formatCurrencyCompact } from '@/utils/currency';
import styles from './BudgetCharts.module.css';
import type { CategorySummary } from './budgetUtils';

/** Estimate is the quiet reference; actual wears the theme colour. */
const ESTIMATE_COLOR = '#c9c1bd';
const THEME_VARS = ['--primary', '--text-muted', '--border'] as const;
const ROW_HEIGHT = 56;

interface Row {
  category: string;
  estimated: number;
  actual: number;
}

function BarTooltip({
  active,
  payload,
  currency,
}: TooltipContentProps & { currency: CurrencyCode }) {
  const entry = payload[0];
  if (!active || !entry) return null;
  const row = entry.payload as Row;
  const diff = row.actual - row.estimated;
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipTitle}>{row.category}</span>
      <span>Estimated: {formatCurrency(row.estimated, currency)}</span>
      <span>Actual: {formatCurrency(row.actual, currency)}</span>
      {row.actual > 0 && row.estimated > 0 && diff !== 0 && (
        <span className={styles.tooltipMuted}>
          {diff > 0 ? 'Over' : 'Under'} estimate by {formatCurrency(Math.abs(diff), currency)}
        </span>
      )}
    </div>
  );
}

interface EstimateVsActualChartProps {
  groups: CategorySummary[];
  currency: CurrencyCode;
}

export function EstimateVsActualChart({ groups, currency }: EstimateVsActualChartProps) {
  const colors = useCssVars(THEME_VARS);
  const reducedMotion = useReducedMotion();
  const rows: Row[] = groups
    .filter((g) => g.estimated > 0 || g.actual > 0)
    .map((g) => ({ category: g.category, estimated: g.estimated, actual: g.actual }));
  const actualColor = colors['--primary'] || '#a64d63';

  return (
    <figure className={styles.chartCard}>
      <figcaption className={styles.chartTitle}>Estimated vs actual</figcaption>

      {rows.length === 0 ? (
        <p className={styles.noData}>Add estimates to your items to compare them here.</p>
      ) : (
        <>
          <ul role="list" className={styles.legend}>
            <li>
              <span className={styles.swatch} style={{ background: ESTIMATE_COLOR }} aria-hidden />
              Estimated
            </li>
            <li>
              <span className={styles.swatch} style={{ background: actualColor }} aria-hidden />
              Actual
            </li>
          </ul>
          <div style={{ height: rows.length * ROW_HEIGHT + 32 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
                barGap={2}
                barCategoryGap="24%"
              >
                <CartesianGrid horizontal={false} stroke={colors['--border']} />
                <XAxis
                  type="number"
                  tickFormatter={(value: number) => formatCurrencyCompact(value, currency)}
                  tick={{ fill: colors['--text-muted'], fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={92}
                  tick={{ fill: colors['--text-muted'], fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={(props) => <BarTooltip {...props} currency={currency} />}
                  cursor={{ fill: colors['--border'], opacity: 0.4 }}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="estimated"
                  name="Estimated"
                  fill={ESTIMATE_COLOR}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={!reducedMotion}
                />
                <Bar
                  dataKey="actual"
                  name="Actual"
                  fill={actualColor}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={!reducedMotion}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </figure>
  );
}
