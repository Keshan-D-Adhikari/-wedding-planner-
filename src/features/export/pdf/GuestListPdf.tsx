import { Text, View } from '@react-pdf/renderer';
import { computeGuestStats, RSVP_LABELS, sideLabel } from '@/features/guests/guestUtils';
import type { Guest, SeatingTable, Wedding } from '@/types';
import { PdfLayout } from './PdfLayout';
import { createStyles, type PdfPalette } from './pdfTheme';

interface GuestListPdfProps {
  wedding: Wedding;
  guests: Guest[];
  tables: SeatingTable[];
  palette: PdfPalette;
}

const COLUMNS = [
  { key: 'name', label: 'Name', width: '25%' },
  { key: 'side', label: 'Side', width: '11%' },
  { key: 'group', label: 'Group', width: '12%' },
  { key: 'rsvp', label: 'RSVP', width: '11%' },
  { key: 'plus', label: '+1', width: '5%' },
  { key: 'food', label: 'Meal / dietary', width: '22%' },
  { key: 'table', label: 'Table', width: '14%' },
] as const;

export function GuestListPdf({ wedding, guests, tables, palette }: GuestListPdfProps) {
  const s = createStyles(palette);
  const stats = computeGuestStats(guests);
  const tableNames = new Map(tables.map((t) => [t.id, t.name]));
  const sorted = [...guests].sort((a, b) => a.name.localeCompare(b.name));

  const summary = [
    ['Invited', stats.invited],
    ['Attending', stats.attending],
    ['Pending', stats.pending],
    ['Declined', stats.declined],
    ['Plus-ones', stats.plusOnes],
    ['Headcount', stats.headcount],
  ] as const;

  return (
    <PdfLayout
      title="Guest list"
      summary={`${stats.invited} invited · ${stats.headcount} attending incl. plus-ones`}
      wedding={wedding}
      styles={s}
    >
      <View style={s.summaryBox}>
        {summary.map(([label, value]) => (
          <View key={label} style={s.summaryItem}>
            <Text style={s.summaryValue}>{value}</Text>
            <Text style={s.summaryLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={s.tableHead} fixed>
        {COLUMNS.map((c) => (
          <Text key={c.key} style={{ width: c.width, paddingRight: 4 }}>
            {c.label}
          </Text>
        ))}
      </View>

      {sorted.map((g, i) => {
        const cells: Record<(typeof COLUMNS)[number]['key'], string> = {
          name: g.name,
          side: sideLabel(g.side, wedding, true),
          group: g.group ?? '',
          rsvp: RSVP_LABELS[g.rsvp],
          plus: g.plusOne ? 'Yes' : '',
          food: [g.mealChoice, g.dietary].filter(Boolean).join(' · '),
          table: (g.tableId && tableNames.get(g.tableId)) || '',
        };
        return (
          <View
            key={g.id}
            style={[s.row, { fontSize: 9 }, i % 2 === 1 ? { backgroundColor: '#fafafa' } : {}]}
            wrap={false}
          >
            {COLUMNS.map((c) => (
              <Text
                key={c.key}
                style={[
                  { width: c.width, paddingRight: 4 },
                  c.key === 'name' ? s.bold : {},
                  c.key === 'rsvp' && g.rsvp === 'declined' ? s.muted : {},
                ]}
              >
                {cells[c.key]}
              </Text>
            ))}
          </View>
        );
      })}
    </PdfLayout>
  );
}
