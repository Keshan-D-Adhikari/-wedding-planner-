import { Text, View } from '@react-pdf/renderer';
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  occupancyByTable,
  tableSize,
  unseatedGuests,
} from '@/features/seating/seatingUtils';
import type { Guest, SeatingTable, Wedding } from '@/types';
import { PdfLayout } from './PdfLayout';
import { createStyles, type PdfPalette } from './pdfTheme';

/**
 * Landscape A4 is 842×595pt. After margins and the title block there's roughly
 * 754×380pt left, so the room is scaled to fit inside both.
 */
const PLAN_SCALE = Math.min((842 - 88) / CANVAS_WIDTH, 380 / CANVAS_HEIGHT);
const PLAN_WIDTH = CANVAS_WIDTH * PLAN_SCALE;

interface SeatingPdfProps {
  wedding: Wedding;
  guests: Guest[];
  tables: SeatingTable[];
  palette: PdfPalette;
}

export function SeatingPdf({ wedding, guests, tables, palette }: SeatingPdfProps) {
  const s = createStyles(palette);
  const occupancy = occupancyByTable(tables, guests);
  const sortedTables = [...tables].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true }),
  );
  const notSeated = unseatedGuests(guests, false);
  const seated = [...occupancy.values()].reduce((sum, o) => sum + o.guests.length, 0);

  return (
    <PdfLayout
      title="Seating chart"
      summary={`${tables.length} tables · ${seated} guests seated`}
      wedding={wedding}
      styles={s}
      orientation="landscape"
    >
      {/* Floor plan: same layout as the app, scaled to the page */}
      <View
        style={{
          position: 'relative',
          width: PLAN_WIDTH,
          height: CANVAS_HEIGHT * PLAN_SCALE,
          borderRadius: 8,
          backgroundColor: palette.primarySoft,
        }}
      >
        {tables.map((t) => {
          const size = tableSize(t.shape, t.capacity);
          const used = occupancy.get(t.id)?.used ?? 0;
          const w = size.width * PLAN_SCALE;
          const h = size.height * PLAN_SCALE;
          return (
            <View
              key={t.id}
              style={{
                position: 'absolute',
                left: t.x * PLAN_SCALE,
                top: t.y * PLAN_SCALE,
                width: w,
                height: h,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: palette.primary,
                borderRadius: t.shape === 'round' ? w / 2 : 8,
                backgroundColor: '#ffffff',
              }}
            >
              <Text
                style={{
                  fontFamily: 'Cormorant',
                  fontWeight: 600,
                  fontSize: 10,
                  textAlign: 'center',
                }}
              >
                {t.name}
              </Text>
              <Text style={{ fontSize: 7, color: palette.muted }}>
                {used}/{t.capacity}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Who sits where — each table box stays together on one page */}
      <Text style={s.sectionTitle} break>
        Guests by table
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
        {sortedTables.map((t) => {
          const o = occupancy.get(t.id);
          return (
            <View key={t.id} style={{ width: '25%', padding: 6 }} wrap={false}>
              <View
                style={{ borderWidth: 1, borderColor: palette.border, borderRadius: 6, padding: 8 }}
              >
                <Text
                  style={{
                    fontFamily: 'Cormorant',
                    fontWeight: 600,
                    fontSize: 13,
                    color: palette.primary,
                  }}
                >
                  {t.name}
                </Text>
                <Text style={[s.small, { marginBottom: 4 }]}>
                  {o?.used ?? 0} of {t.capacity} seats
                </Text>
                {(o?.guests ?? []).map((g) => (
                  <Text key={g.id} style={{ fontSize: 9 }}>
                    {g.name}
                    {g.plusOne ? ' (+1)' : ''}
                  </Text>
                ))}
                {(o?.guests.length ?? 0) === 0 && <Text style={s.small}>No one yet</Text>}
              </View>
            </View>
          );
        })}
      </View>

      {notSeated.length > 0 && (
        <View wrap={false}>
          <Text style={s.sectionTitle}>Attending but not seated yet ({notSeated.length})</Text>
          <Text style={{ fontSize: 9 }}>
            {notSeated.map((g) => g.name + (g.plusOne ? ' (+1)' : '')).join(', ')}
          </Text>
        </View>
      )}
    </PdfLayout>
  );
}
