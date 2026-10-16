import { differenceInCalendarDays, max, startOfToday, subDays } from 'date-fns';
import { TIMEFRAMES, type ChecklistTask, type TaskCategory, type Timeframe } from '@/types';
import { parseDate, toISODate } from '@/utils/date';
import { createId } from '@/utils/id';

interface TaskTemplate {
  title: string;
  category: TaskCategory;
  notes?: string;
}

/**
 * How many days before the wedding each timeframe runs: [earliest, latest].
 * Tasks inside a timeframe are spread evenly across its window.
 */
const TIMEFRAME_WINDOWS: Record<Timeframe, [number, number]> = {
  '12+ months': [400, 330],
  '9-12 months': [330, 270],
  '6-9 months': [270, 180],
  '4-6 months': [180, 120],
  '2-4 months': [120, 60],
  '1 month': [45, 21],
  '1-2 weeks': [14, 3],
  'Day before': [1, 1],
  'Wedding day': [0, 0],
};

const TEMPLATES: Record<Timeframe, TaskTemplate[]> = {
  '12+ months': [
    { title: 'Talk about your wedding vision and style together', category: 'Other' },
    { title: 'Set your overall wedding budget', category: 'Other' },
    { title: 'Draft a rough guest list', category: 'Guests' },
    { title: 'Choose a wedding date (and a backup date)', category: 'Ceremony' },
    { title: 'Research and book your ceremony venue', category: 'Venue' },
    { title: 'Research and book your reception venue', category: 'Venue' },
    { title: 'Start a wedding inspiration board', category: 'Other' },
    { title: 'Choose your wedding party', category: 'Guests' },
  ],
  '9-12 months': [
    { title: 'Book your photographer', category: 'Vendors' },
    { title: 'Book your videographer', category: 'Vendors' },
    { title: 'Hire a wedding planner or coordinator (optional)', category: 'Vendors' },
    { title: 'Book your caterer', category: 'Reception' },
    { title: 'Book your officiant', category: 'Ceremony' },
    { title: 'Start shopping for wedding attire', category: 'Attire' },
    { title: 'Create a wedding website or share page', category: 'Guests' },
    { title: 'Send save-the-dates', category: 'Guests' },
  ],
  '6-9 months': [
    { title: 'Order your wedding dress or outfit', category: 'Attire' },
    { title: 'Book a band or DJ', category: 'Reception' },
    { title: 'Book your florist', category: 'Vendors' },
    { title: 'Book your hair and makeup artist', category: 'Beauty' },
    { title: 'Choose and order the wedding cake', category: 'Reception' },
    { title: 'Reserve rooms for out-of-town guests', category: 'Guests' },
    { title: 'Plan your honeymoon', category: 'Other' },
    { title: 'Book a decorator and plan your decor theme', category: 'Reception' },
  ],
  '4-6 months': [
    { title: 'Order invitations and stationery', category: 'Guests' },
    { title: 'Choose outfits for the wedding party', category: 'Attire' },
    { title: 'Book wedding-day transport', category: 'Vendors' },
    { title: 'Plan the ceremony order and music', category: 'Ceremony' },
    { title: 'Shop for wedding rings', category: 'Attire' },
    { title: 'Book a venue for pre-wedding events', category: 'Venue' },
    { title: 'Set up a gift registry (optional)', category: 'Guests' },
    { title: 'Start a skincare and wellness routine', category: 'Beauty' },
  ],
  '2-4 months': [
    { title: 'Send invitations', category: 'Guests' },
    { title: 'Schedule dress or outfit fittings', category: 'Attire' },
    { title: 'Do a hair and makeup trial', category: 'Beauty' },
    { title: 'Finalise the menu with your caterer', category: 'Reception' },
    {
      title: 'Check marriage licence and registration requirements',
      category: 'Legal',
      notes: 'Requirements and processing times differ by country — check early.',
    },
    { title: 'Buy shoes and accessories', category: 'Attire' },
    { title: 'Plan the reception timeline', category: 'Reception' },
    { title: 'Write or choose your vows', category: 'Ceremony' },
  ],
  '1 month': [
    { title: 'Follow up on missing RSVPs', category: 'Guests' },
    { title: 'Apply for your marriage licence / register your marriage', category: 'Legal' },
    { title: 'Create the seating plan', category: 'Guests' },
    { title: 'Confirm the details with every vendor', category: 'Vendors' },
    { title: 'Final dress or outfit fitting', category: 'Attire' },
    { title: 'Prepare vendor payments and tips', category: 'Vendors' },
    { title: 'Buy gifts for your wedding party and parents', category: 'Other' },
  ],
  '1-2 weeks': [
    { title: 'Give the final headcount to your caterer and venue', category: 'Reception' },
    { title: 'Share the day-of timeline with vendors and wedding party', category: 'Vendors' },
    { title: 'Pack for the honeymoon', category: 'Other' },
    { title: 'Break in your wedding shoes', category: 'Attire' },
    {
      title: 'Prepare a wedding-day emergency kit',
      category: 'Other',
      notes: 'Safety pins, sewing kit, plasters, tissues, painkillers, phone charger, snacks.',
    },
    { title: 'Get a haircut or colour', category: 'Beauty' },
    { title: 'Confirm transport and pickup times', category: 'Vendors' },
  ],
  'Day before': [
    { title: 'Attend the rehearsal', category: 'Ceremony' },
    { title: 'Lay out outfits, rings and accessories', category: 'Attire' },
    { title: 'Put final payments in labelled envelopes', category: 'Vendors' },
    { title: "Get a good night's sleep", category: 'Beauty' },
  ],
  'Wedding day': [
    { title: 'Eat a proper breakfast', category: 'Other' },
    { title: 'Give the rings to your best man or maid of honour', category: 'Ceremony' },
    { title: 'Hand the emergency kit to someone you trust', category: 'Other' },
    { title: 'Take a quiet moment together to enjoy it', category: 'Other' },
  ],
};

/** The earliest any default task is ideally scheduled (start of '12+ months'). */
const IDEAL_PLANNING_DAYS = TIMEFRAME_WINDOWS['12+ months'][0];
/** Tasks this close to the day keep their exact timing, even on short engagements. */
const FIXED_FINAL_DAYS = 14;

/**
 * Short engagement? Squeeze the long-range schedule proportionally into the time
 * available, so tasks are spread out instead of all landing on "today".
 */
function scheduledDaysBefore(idealDaysBefore: number, daysAvailable: number): number {
  if (daysAvailable >= IDEAL_PLANNING_DAYS || idealDaysBefore <= FIXED_FINAL_DAYS) {
    return idealDaysBefore;
  }
  const scaled = Math.round((idealDaysBefore * daysAvailable) / IDEAL_PLANNING_DAYS);
  // Keep long-range tasks before the final two weeks — unless the wedding is
  // closer than that, in which case they share whatever days are left.
  const floor = daysAvailable > FIXED_FINAL_DAYS ? FIXED_FINAL_DAYS + 1 : 0;
  return Math.max(floor, scaled);
}

/**
 * Builds the starter checklist (62 tasks) with due dates counted back from the wedding.
 * Dates never fall before today, so nothing is overdue on day one.
 */
export function buildDefaultTasks(weddingDate: string): ChecklistTask[] {
  const wedding = parseDate(weddingDate);
  if (!wedding) throw new Error(`Invalid wedding date: ${weddingDate}`);

  const today = startOfToday();
  const daysAvailable = differenceInCalendarDays(wedding, today);
  let order = 0;

  return TIMEFRAMES.flatMap((timeframe) => {
    const templates = TEMPLATES[timeframe];
    const [earliest, latest] = TIMEFRAME_WINDOWS[timeframe];
    const step = templates.length > 1 ? (earliest - latest) / (templates.length - 1) : 0;

    return templates.map((template, index): ChecklistTask => {
      const idealDaysBefore = Math.round(earliest - step * index);
      const daysBefore = scheduledDaysBefore(idealDaysBefore, daysAvailable);
      const due = max([subDays(wedding, daysBefore), today]);

      return {
        id: createId(),
        title: template.title,
        notes: template.notes,
        category: template.category,
        timeframe,
        dueDate: toISODate(due),
        completed: false,
        isCustom: false,
        order: order++,
      };
    });
  });
}
