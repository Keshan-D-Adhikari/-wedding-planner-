import type { Ref } from 'react';
import type { DashboardStats } from '@/hooks/useDashboardStats';
import type { Wedding } from '@/types';
import { daysUntil } from '@/utils/date';
import { CardFrame, CoupleNames } from './CardFrame';
import styles from './cards.module.css';

const RING = 520;
const STROKE = 28;

interface ChecklistCardProps {
  wedding: Wedding;
  stats: DashboardStats;
  ref?: Ref<HTMLDivElement>;
}

export function ChecklistCard({ wedding, stats, ref }: ChecklistCardProps) {
  const percent = stats.tasksTotal > 0 ? (stats.tasksDone / stats.tasksTotal) * 100 : 0;
  const radius = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const days = daysUntil(wedding.weddingDate) ?? 0;
  const upNext = stats.nextTasks.slice(0, 3);

  return (
    <CardFrame eyebrow="Wedding planning progress" ref={ref}>
      <CoupleNames first={wedding.partner1Name} second={wedding.partner2Name} size={72} />

      <div className={styles.ring} style={{ width: RING, height: RING }}>
        <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} aria-hidden>
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={radius}
            className={styles.ringTrack}
            strokeWidth={STROKE}
          />
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={radius}
            className={styles.ringValue}
            strokeWidth={STROKE}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
          />
        </svg>
        <div className={styles.ringCenter}>
          <span className={styles.ringPercent}>{Math.round(percent)}%</span>
          <span className={styles.ringLabel}>
            {stats.tasksDone} of {stats.tasksTotal} tasks done
          </span>
        </div>
      </div>

      {upNext.length > 0 ? (
        <div className={styles.upNext}>
          <p className={styles.upNextTitle}>Up next</p>
          <ul>
            {upNext.map((task) => (
              <li key={task.id}>{task.title}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p className={styles.bigLabel}>Every task is done!</p>
      )}

      {days > 0 && (
        <p className={styles.venue}>
          {days.toLocaleString()} {days === 1 ? 'day' : 'days'} to go
        </p>
      )}
    </CardFrame>
  );
}
