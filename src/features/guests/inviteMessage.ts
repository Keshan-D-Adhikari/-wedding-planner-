import type { Wedding } from '@/types';
import { formatDate } from '@/utils/date';
import { readLocal, writeLocal } from '@/utils/localStore';
import { firstName } from './guestUtils';

export const PLACEHOLDERS = [
  { token: '{name}', meaning: "the guest's first name" },
  { token: '{couple}', meaning: 'your names' },
  { token: '{date}', meaning: 'the wedding date' },
  { token: '{place}', meaning: 'the venue (left out if empty)' },
] as const;

export const DEFAULT_TEMPLATE = `Hi {name}! 💍

{couple} are getting married on {date}{place}, and we'd love you to be there.

Can you join us? Please reply *YES* or *NO* (add +1 if you're bringing someone).

Thank you! ❤️`;

const TEMPLATE_KEY = 'wp-invite-template';
const COUNTRY_KEY = 'wp-country-code';
export const MAX_TEMPLATE_LENGTH = 1000;

export function loadTemplate(): string {
  return readLocal(TEMPLATE_KEY) || DEFAULT_TEMPLATE;
}

export function saveTemplate(template: string): void {
  // Saving the default means "no custom message", so future default improvements apply.
  writeLocal(TEMPLATE_KEY, template === DEFAULT_TEMPLATE ? '' : template);
}

export function loadCountryCode(fallback: string): string {
  return readLocal(COUNTRY_KEY) ?? fallback;
}

export function saveCountryCode(code: string): void {
  writeLocal(COUNTRY_KEY, code);
}

/** Fills the placeholders for one guest. Unknown {words} are left as typed. */
export function fillTemplate(
  template: string,
  guestName: string,
  wedding: Pick<Wedding, 'partner1Name' | 'partner2Name' | 'weddingDate' | 'venue'>,
): string {
  const values: Record<string, string> = {
    name: firstName(guestName),
    couple: `${wedding.partner1Name} & ${wedding.partner2Name}`,
    date: formatDate(wedding.weddingDate, 'EEEE, d MMMM yyyy'),
    place: wedding.venue ? ` at ${wedding.venue}` : '',
  };
  return template.replace(/\{(name|couple|date|place)\}/g, (_, key: string) => values[key] ?? '');
}
