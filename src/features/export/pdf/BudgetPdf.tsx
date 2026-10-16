import { Text, View } from '@react-pdf/renderer';
import { computeTotals, itemCost, summarizeByCategory } from '@/features/budget/budgetUtils';
import type { BudgetItem, Wedding } from '@/types';
import { formatDate } from '@/utils/date';
import { PdfLayout } from './PdfLayout';
import { createStyles, pdfMoney, type PdfPalette } from './pdfTheme';

interface BudgetPdfProps {
  wedding: Wedding;
  items: BudgetItem[];
  palette: PdfPalette;
}

const COL = { item: '34%', est: '15%', act: '15%', paid: '15%', due: '21%' } as const;

export function BudgetPdf({ wedding, items, palette }: BudgetPdfProps) {
  const s = createStyles(palette);
  const money = (n: number) => pdfMoney(n, wedding.currency);
  const totals = computeTotals(items, wedding.totalBudget);
  const groups = summarizeByCategory(items);

  const summary: [string, string, boolean?][] = [
    ['Total budget', money(totals.totalBudget)],
    ['Planned', money(totals.projected)],
    [
      totals.isOverBudget ? 'Over budget' : 'Left',
      money(Math.abs(totals.remaining)),
      totals.isOverBudget,
    ],
    ['Estimated', money(totals.estimated)],
    ['Actual', money(totals.actual)],
    ['Paid / still to pay', `${money(totals.paid)} / ${money(totals.outstanding)}`],
  ];

  const right = { textAlign: 'right' as const, paddingRight: 6 };

  return (
    <PdfLayout
      title="Wedding budget"
      summary={`${items.length} items`}
      wedding={wedding}
      styles={s}
    >
      <View style={s.summaryBox}>
        {summary.map(([label, value, danger]) => (
          <View key={label} style={s.summaryItem}>
            <Text style={[s.summaryValue, danger ? { color: '#b03a3a' } : {}]}>{value}</Text>
            <Text style={s.summaryLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <Text style={[s.small, { marginBottom: 6 }]}>
        "Planned" uses each item's actual cost once it's known, otherwise its estimate.
      </Text>

      {groups.map((group) => (
        <View key={group.category}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}
            minPresenceAhead={50}
          >
            <Text style={s.sectionTitle}>{group.category}</Text>
            <Text style={[s.sectionTitle, { fontSize: 12 }]}>{money(group.projected)}</Text>
          </View>
          <View style={s.tableHead}>
            <Text style={{ width: COL.item }}>Item</Text>
            <Text style={[{ width: COL.est }, right]}>Estimated</Text>
            <Text style={[{ width: COL.act }, right]}>Actual</Text>
            <Text style={[{ width: COL.paid }, right]}>Paid</Text>
            <Text style={[{ width: COL.due }, right]}>Payment due</Text>
          </View>
          {group.items.map((item) => {
            const settled = itemCost(item) > 0 && item.paid >= itemCost(item);
            return (
              <View key={item.id} style={[s.row, { fontSize: 9 }]} wrap={false}>
                <View style={{ width: COL.item, paddingRight: 6 }}>
                  <Text style={s.bold}>{item.name}</Text>
                  {item.vendorName ? <Text style={s.small}>{item.vendorName}</Text> : null}
                </View>
                <Text style={[{ width: COL.est }, right]}>{money(item.estimated)}</Text>
                <Text style={[{ width: COL.act }, right]}>
                  {item.actual > 0 ? money(item.actual) : '—'}
                </Text>
                <Text style={[{ width: COL.paid }, right]}>{money(item.paid)}</Text>
                <Text style={[{ width: COL.due }, right, s.small]}>
                  {settled
                    ? 'Fully paid'
                    : item.dueDate
                      ? formatDate(item.dueDate, 'd MMM yyyy')
                      : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </PdfLayout>
  );
}
