import { Text, View } from '@react-pdf/renderer';
import { TIMEFRAME_LABELS } from '@/features/checklist/timeframeLabels';
import { TIMEFRAMES, type ChecklistTask, type Wedding } from '@/types';
import { formatDate } from '@/utils/date';
import { compareTasks, isTaskOverdue } from '@/utils/tasks';
import { PdfLayout } from './PdfLayout';
import { createStyles, type PdfPalette } from './pdfTheme';

interface ChecklistPdfProps {
  wedding: Wedding;
  tasks: ChecklistTask[];
  palette: PdfPalette;
}

export function ChecklistPdf({ wedding, tasks, palette }: ChecklistPdfProps) {
  const s = createStyles(palette);
  const done = tasks.filter((t) => t.completed).length;

  return (
    <PdfLayout
      title="Wedding checklist"
      summary={`${done} of ${tasks.length} tasks done`}
      wedding={wedding}
      styles={s}
    >
      {TIMEFRAMES.map((timeframe) => {
        const group = tasks.filter((t) => t.timeframe === timeframe).sort(compareTasks);
        if (group.length === 0) return null;
        const groupDone = group.filter((t) => t.completed).length;

        return (
          <View key={timeframe}>
            {/* minPresenceAhead keeps a heading from being stranded at the bottom of a page */}
            <Text style={s.sectionTitle} minPresenceAhead={40}>
              {TIMEFRAME_LABELS[timeframe]}{' '}
              <Text style={[s.small, { fontFamily: 'Helvetica' }]}>
                ({groupDone}/{group.length})
              </Text>
            </Text>
            {group.map((task) => {
              const overdue = isTaskOverdue(task);
              return (
                <View key={task.id} style={s.row} wrap={false}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      marginRight: 8,
                      borderWidth: 1,
                      borderColor: palette.primary,
                      borderRadius: 2,
                      backgroundColor: task.completed ? palette.primary : 'transparent',
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={
                        task.completed
                          ? { color: palette.muted, textDecoration: 'line-through' }
                          : undefined
                      }
                    >
                      {task.title}
                    </Text>
                    {task.notes ? <Text style={s.small}>{task.notes}</Text> : null}
                  </View>
                  <Text style={[s.small, { width: 70 }]}>{task.category}</Text>
                  <Text
                    style={[
                      s.small,
                      { width: 70, textAlign: 'right' },
                      overdue ? { color: '#b03a3a', fontFamily: 'Helvetica-Bold' } : {},
                    ]}
                  >
                    {task.dueDate ? formatDate(task.dueDate, 'd MMM yyyy') : ''}
                  </Text>
                </View>
              );
            })}
          </View>
        );
      })}
    </PdfLayout>
  );
}
