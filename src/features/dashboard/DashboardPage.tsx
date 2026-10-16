import { Armchair, ListChecks, ShieldCheck, Users, Wallet } from 'lucide-react';
import { PageLoader } from '@/components/PageLoader';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useWedding } from '@/hooks/useWedding';
import { PRIVACY_NOTE } from '@/utils/constants';
import { formatCurrency } from '@/utils/currency';
import { BackupReminder } from '@/features/export/BackupReminder';
import { Countdown } from './Countdown';
import styles from './DashboardPage.module.css';
import { NextTasks } from './NextTasks';
import { QuickLinks } from './QuickLinks';
import { StatCard } from './StatCard';

function percent(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}

export default function DashboardPage() {
  const { wedding } = useWedding();
  const stats = useDashboardStats();

  // RequireWedding guarantees a wedding; this only covers the first loading tick.
  if (!wedding || !stats) return <PageLoader />;

  const { currency, totalBudget } = wedding;
  const budgetPercent = percent(stats.budgetActual, totalBudget);
  const budgetTone = budgetPercent > 100 ? 'danger' : budgetPercent > 90 ? 'warning' : 'primary';
  const checklistPercent = percent(stats.tasksDone, stats.tasksTotal);

  return (
    <div className={styles.page}>
      <BackupReminder />
      <Countdown wedding={wedding} />

      <section aria-label="Planning progress" className={styles.stats}>
        <StatCard
          to="/checklist"
          icon={ListChecks}
          label="Checklist"
          value={`${Math.round(checklistPercent)}%`}
          detail={
            stats.tasksOverdue > 0
              ? `${stats.tasksDone} of ${stats.tasksTotal} done · ${stats.tasksOverdue} overdue`
              : `${stats.tasksDone} of ${stats.tasksTotal} tasks done`
          }
          percent={checklistPercent}
          tone={checklistPercent === 100 ? 'success' : 'primary'}
        />
        <StatCard
          to="/budget"
          icon={Wallet}
          label="Spent"
          value={formatCurrency(stats.budgetActual, currency)}
          detail={
            totalBudget > 0 ? `of ${formatCurrency(totalBudget, currency)}` : 'Set your budget'
          }
          percent={budgetPercent}
          tone={budgetTone}
        />
        <StatCard
          to="/guests"
          icon={Users}
          label="Attending"
          value={`${stats.guestsAttending} / ${stats.guestsInvited}`}
          detail={
            stats.guestsInvited > 0
              ? `${stats.headcount} people incl. plus-ones`
              : 'Add your guests'
          }
          percent={percent(stats.guestsAttending, stats.guestsInvited)}
        />
        <StatCard
          to="/seating"
          icon={Armchair}
          label="Seated"
          value={`${stats.guestsSeated} / ${stats.guestsAttending}`}
          detail={
            stats.tablesCount > 0
              ? `${stats.tablesCount} ${stats.tablesCount === 1 ? 'table' : 'tables'}`
              : 'No tables yet'
          }
          percent={percent(stats.guestsSeated, stats.guestsAttending)}
          tone={
            stats.guestsAttending > 0 && stats.guestsSeated === stats.guestsAttending
              ? 'success'
              : 'primary'
          }
        />
      </section>

      <div className={styles.columns}>
        <NextTasks tasks={stats.nextTasks} />
        <QuickLinks />
      </div>

      <p className={styles.privacy}>
        <ShieldCheck aria-hidden size={16} />
        {PRIVACY_NOTE}
      </p>
    </div>
  );
}
