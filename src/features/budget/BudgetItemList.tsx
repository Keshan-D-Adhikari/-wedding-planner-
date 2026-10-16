import { ChevronRight, CircleCheck, Plus } from 'lucide-react';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import type { BudgetItem, CurrencyCode } from '@/types';
import { cx } from '@/utils/classNames';
import { formatCurrency } from '@/utils/currency';
import { daysUntil, formatDate } from '@/utils/date';
import styles from './BudgetItemList.module.css';
import { itemCost, itemOutstanding, type CategorySummary } from './budgetUtils';

function paymentStatus(item: BudgetItem): { text: string; overdue: boolean; paid: boolean } {
  const cost = itemCost(item);
  if (cost > 0 && itemOutstanding(item) === 0)
    return { text: 'Fully paid', overdue: false, paid: true };
  if (!item.dueDate) return { text: '', overdue: false, paid: false };
  const days = daysUntil(item.dueDate) ?? 0;
  const date = formatDate(item.dueDate, 'd MMM yyyy');
  if (days < 0) return { text: `Payment overdue · ${date}`, overdue: true, paid: false };
  if (days === 0) return { text: 'Payment due today', overdue: false, paid: false };
  return { text: `Payment due ${date}`, overdue: false, paid: false };
}

interface BudgetItemListProps {
  groups: CategorySummary[];
  currency: CurrencyCode;
  onEdit: (item: BudgetItem) => void;
  onAdd: (category: string) => void;
}

export function BudgetItemList({ groups, currency, onEdit, onAdd }: BudgetItemListProps) {
  const money = (amount: number) => formatCurrency(amount, currency);

  return (
    <div className={styles.groups}>
      {groups.map((group) => (
        <section key={group.category} className={styles.group} aria-label={group.category}>
          <header className={styles.header}>
            <h3 className={styles.category}>{group.category}</h3>
            <span className={styles.groupTotal}>{money(group.projected)}</span>
          </header>

          <ul role="list" className={styles.list}>
            {group.items.map((item) => {
              const cost = itemCost(item);
              const status = paymentStatus(item);
              const usesEstimate = item.actual === 0 && item.estimated > 0;
              return (
                <li key={item.id}>
                  <button type="button" className={styles.row} onClick={() => onEdit(item)}>
                    <span className="visually-hidden">Edit </span>
                    <span className={styles.main}>
                      <span className={styles.name}>{item.name}</span>
                      {item.vendorName && <span className={styles.vendor}>{item.vendorName}</span>}
                      {cost > 0 && (
                        <ProgressBar
                          value={(item.paid / cost) * 100}
                          label={`${item.name}: paid`}
                          tone={status.paid ? 'success' : 'primary'}
                          className={styles.paidBar}
                        />
                      )}
                      <span className={styles.meta}>
                        {cost > 0 && !status.paid && (
                          <span>
                            Paid {money(item.paid)} of {money(cost)}
                          </span>
                        )}
                        {status.text && (
                          <span
                            className={cx(
                              status.overdue && styles.overdue,
                              status.paid && styles.paid,
                            )}
                          >
                            {status.paid && <CircleCheck aria-hidden size={12} />}
                            {status.text}
                          </span>
                        )}
                      </span>
                    </span>
                    <span className={styles.amount}>
                      <span className={styles.cost}>{money(cost)}</span>
                      {usesEstimate && <span className={styles.estimate}>estimate</span>}
                    </span>
                    <ChevronRight aria-hidden size={18} className={styles.chevron} />
                  </button>
                </li>
              );
            })}
          </ul>

          <Button
            variant="ghost"
            size="sm"
            icon={<Plus aria-hidden />}
            onClick={() => onAdd(group.category)}
            className={styles.add}
          >
            Add to {group.category}
          </Button>
        </section>
      ))}
    </div>
  );
}
