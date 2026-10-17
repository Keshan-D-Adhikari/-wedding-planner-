import type { Timeframe } from '@/types';
import type { TaskTemplate } from './defaultTasks';

export interface TaskPack {
  id: 'sri-lankan' | 'indian';
  label: string;
  description: string;
  templates: Partial<Record<Timeframe, TaskTemplate[]>>;
}

/**
 * Extra tasks for traditional weddings. They sit on top of the standard checklist,
 * and every task can be edited or deleted. Customs vary by family and region, so
 * these are prompts to confirm with your elders, priest or astrologer.
 */
export const TASK_PACKS: readonly TaskPack[] = [
  {
    id: 'sri-lankan',
    label: 'Sri Lankan wedding',
    description: 'Horoscopes, Nakath times, Poruwa, Ashtaka, homecoming and registration',
    templates: {
      '12+ months': [
        {
          title: 'Talk with both families about the format: Poruwa ceremony, reception, homecoming',
          category: 'Ceremony',
        },
        {
          title: 'Have your horoscopes (kendara) matched by an astrologer',
          category: 'Ceremony',
          notes: 'Ask the astrologer for auspicious dates at the same time.',
        },
      ],
      '9-12 months': [
        {
          title: 'Get the Nakath (auspicious times) for the engagement, wedding and homecoming',
          category: 'Ceremony',
          notes: 'Add the times to each event on the Events page.',
        },
        { title: 'Book the Poruwa decorator and dais', category: 'Vendors' },
      ],
      '6-9 months': [
        { title: 'Book the Ashtaka and Jayamangala Gatha reciters', category: 'Vendors' },
        { title: 'Book Magul Bera drummers and traditional dancers', category: 'Vendors' },
        { title: 'Order the bridal saree and the groom’s outfit', category: 'Attire' },
        { title: 'Plan the homecoming venue and décor', category: 'Venue' },
      ],
      '4-6 months': [
        { title: 'Choose bridal jewellery — buy or rent', category: 'Attire' },
        { title: 'Book the bridal dresser and groom’s grooming', category: 'Beauty' },
        {
          title: 'Plan the order of the Poruwa rituals with elders and the Ashtaka team',
          category: 'Ceremony',
        },
      ],
      '2-4 months': [
        {
          title: 'Print and send invitations with the Nakath and a venue map',
          category: 'Guests',
        },
        {
          title: 'Arrange the betel sheaves (bulath hurulla) to offer your elders',
          category: 'Ceremony',
        },
        { title: 'Order sweets and gifts for the homecoming', category: 'Reception' },
      ],
      '1 month': [
        {
          title: 'Reconfirm every Nakath with the astrologer and share the times with all vendors',
          category: 'Vendors',
        },
        {
          title: 'Arrange the Registrar of Marriages and two witnesses for signing',
          category: 'Legal',
          notes: 'Ask your Divisional Secretariat about the notice period and forms.',
        },
        { title: 'Arrange transport for both families', category: 'Vendors' },
        { title: 'Book rooms for relatives travelling from far away', category: 'Guests' },
      ],
      '1-2 weeks': [
        { title: 'Walk through the Poruwa ceremony with the Ashtaka team', category: 'Ceremony' },
        { title: 'Pack the bride’s homecoming bag and going-away outfit', category: 'Attire' },
      ],
      'Day before': [
        { title: 'Set up the Poruwa and check every ritual item', category: 'Ceremony' },
      ],
      'Wedding day': [
        { title: 'Be ready 30 minutes before the Nakath', category: 'Ceremony' },
        { title: 'Check the Registrar and both witnesses are present', category: 'Legal' },
      ],
    },
  },
  {
    id: 'indian',
    label: 'Indian wedding',
    description: 'Muhurat, Mehendi, Haldi, Sangeet, baraat and registration',
    templates: {
      '12+ months': [
        { title: 'Agree the events and traditions with both families', category: 'Ceremony' },
        {
          title: 'Match horoscopes (kundli) if your families follow this',
          category: 'Ceremony',
        },
      ],
      '9-12 months': [
        {
          title: 'Ask your priest for the Muhurat (auspicious dates and times)',
          category: 'Ceremony',
          notes: 'Add the times to each event on the Events page.',
        },
        { title: 'Book the main venue and the mandap décor', category: 'Venue' },
      ],
      '6-9 months': [
        { title: 'Book the priest (pandit) for the ceremony', category: 'Vendors' },
        { title: 'Book a mehendi artist', category: 'Beauty' },
        { title: 'Book a DJ or choreographer for the Sangeet', category: 'Vendors' },
        {
          title: 'Shop for the bridal lehenga or saree and the groom’s sherwani',
          category: 'Attire',
        },
      ],
      '4-6 months': [
        { title: 'Choose bridal jewellery', category: 'Attire' },
        { title: 'Plan the baraat — procession route, band and horse', category: 'Ceremony' },
        { title: 'Plan the Sangeet performances and rehearsals', category: 'Reception' },
        {
          title: 'Check marriage registration requirements and the documents needed',
          category: 'Legal',
          notes:
            'Depends on your religion and location — Hindu Marriage Act or Special Marriage Act.',
        },
      ],
      '2-4 months': [
        { title: 'Send invitations and book rooms for guests', category: 'Guests' },
        { title: 'Finalise the menu for each event', category: 'Reception' },
        { title: 'Book Haldi and Mehendi décor', category: 'Reception' },
        { title: 'Prepare return gifts and shagun envelopes', category: 'Other' },
      ],
      '1 month': [
        { title: 'Reconfirm the Muhurat and share timings with all vendors', category: 'Vendors' },
        {
          title: 'Get the puja samagri (ritual items) list from your priest',
          category: 'Ceremony',
        },
        { title: 'Arrange transport for the baraat and guests', category: 'Vendors' },
      ],
      '1-2 weeks': [
        { title: 'Final fittings for every outfit', category: 'Attire' },
        { title: 'Confirm the schedule for Mehendi, Haldi and Sangeet', category: 'Reception' },
        { title: 'Pack for the vidaai and honeymoon', category: 'Other' },
      ],
      'Day before': [{ title: 'Keep puja items, rings and garlands ready', category: 'Ceremony' }],
      'Wedding day': [
        { title: 'Reach the venue before the Muhurat', category: 'Ceremony' },
        {
          title: 'Keep the rings and varmala garlands where the priest asks',
          category: 'Ceremony',
        },
      ],
    },
  },
];

export function countPackTasks(pack: TaskPack): number {
  return Object.values(pack.templates).reduce((sum, list) => sum + (list?.length ?? 0), 0);
}
