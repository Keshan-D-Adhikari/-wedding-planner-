import type { Guest, RsvpStatus } from '@/types';
import { digitsOnly } from '@/utils/whatsapp';
import { normalizeName } from './guestUtils';

export type Intent = 'attending' | 'declined' | 'unclear';

export interface Reply {
  /** Who sent it — a saved contact name or a phone number */
  sender: string;
  /** Their latest message in the paste */
  message: string;
  intent: Intent;
  plusOne: boolean;
  /** The matching guest, or null when no single guest fits */
  guest: Guest | null;
  /** Why there's no match (shown to the user) */
  problem?: string;
}

/* ---------- Reading the pasted text ---------- */

/**
 * WhatsApp's two export styles start each message with a date and time:
 *   [17/10/2026, 10:30:15 AM] Nimali: Yes!      (iPhone)
 *   17/10/2026, 10:30 - Nimali: Yes!            (Android)
 * Plain lines like "Nimali: yes" work too.
 */
const TIMESTAMP =
  /^‎?\[?\s*\d{1,4}[/.-]\d{1,2}[/.-]\d{1,4},?\s+\d{1,2}[:.]\d{2}(?::\d{2})?\s*(?:[APap]\.?[Mm]\.?)?\s*\]?\s*(?:[-–]\s*)?/;

interface RawMessage {
  sender: string;
  message: string;
  /** Position in the chat, so a later message can replace an earlier one */
  seq: number;
}

/** Splits the pasted text into messages, keeping the LAST message from each sender. */
export function readMessages(text: string): RawMessage[] {
  const latest = new Map<string, RawMessage>();
  let current = null as RawMessage | null;
  let seq = 0;

  const commit = () => {
    if (current) latest.set(normalizeName(current.sender), current);
    current = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/[‎‏‪-‮]/g, '').trim();
    if (!line) continue;

    const hasTimestamp = TIMESTAMP.test(line);
    const body = line.replace(TIMESTAMP, '');
    const colon = body.indexOf(': ');
    const looksLikeSender = colon > 0 && colon <= 60;

    if (looksLikeSender) {
      commit();
      current = {
        sender: body.slice(0, colon).trim(),
        message: body.slice(colon + 2).trim(),
        seq: seq++,
      };
    } else if (hasTimestamp) {
      commit(); // a system line such as "Messages are end-to-end encrypted"
    } else if (current) {
      // A reply that continues on the next line
      current = { ...current, message: `${current.message} ${line}` };
    }
  }
  commit();
  return [...latest.values()].sort((a, b) => a.seq - b.seq);
}

/* ---------- Understanding the answer ---------- */

const NO_FIXED = ['❌', '👎', '😔', '😢', 'නැහැ', 'නෑ', 'බැහැ', 'இல்லை', 'முடியாது'];
const YES_FIXED = ['✅', '👍', '🥰', '😍', '🎉', '❤', 'ඔව්', 'එනවා', 'ஆம்', 'வருகிறேன்'];
const NO_WORDS =
  /\b(no|nope|nah|can'?t|cannot|can not|won'?t|unable|sorry|unfortunately|not able|not coming|not attending|decline|declined|regret)\b/;
const YES_WORDS =
  /\b(yes|yeah|yep|yup|yea|sure|ok|okay|definitely|absolutely|coming|will come|will be there|be there|attend|attending|count me in|confirmed|confirm|accept|accepted|happy to)\b/;
const UNSURE_WORDS =
  /\b(maybe|not sure|unsure|tentative|let you know|will confirm later|depends|perhaps)\b/;
const PLUS_ONE =
  /(\+\s?1\b|plus\s?one|both of us|we both|two of us|2 of us|us both|with (my )?(wife|husband|partner|spouse|girlfriend|boyfriend|fianc[eé]e?))/;

/** Works out what a free-text reply means. Mixed or vague answers are "unclear". */
export function detectIntent(message: string): { intent: Intent; plusOne: boolean } {
  // "no problem" / "no worries" are friendly YES words, not refusals.
  const text = message
    .toLowerCase()
    .replace(/\bno (problem|worries|issue)\b/g, ' ok ')
    .replace(/[’‘]/g, "'");

  const no = NO_WORDS.test(text) || NO_FIXED.some((s) => text.includes(s));
  const yes = YES_WORDS.test(text) || YES_FIXED.some((s) => text.includes(s));
  const unsure = UNSURE_WORDS.test(text);

  let intent: Intent = 'unclear';
  if (!unsure && yes && !no) intent = 'attending';
  else if (!unsure && no && !yes) intent = 'declined';

  return { intent, plusOne: intent === 'attending' && PLUS_ONE.test(text) };
}

/* ---------- Matching a sender to a guest ---------- */

const lastNine = (value: string) => digitsOnly(value).slice(-9);

function matchGuest(sender: string, guests: Guest[]): { guest: Guest | null; problem?: string } {
  const senderPhone = lastNine(sender);
  // A sender that is a phone number matches by the guest's saved phone.
  if (senderPhone.length >= 8 && digitsOnly(sender).length >= 8 && !/[a-z]/i.test(sender)) {
    const byPhone = guests.filter((g) => g.phone && lastNine(g.phone) === senderPhone);
    if (byPhone.length === 1) return { guest: byPhone[0] ?? null };
    return {
      guest: null,
      problem:
        byPhone.length > 1 ? 'Several guests share this number' : 'No guest has this phone number',
    };
  }

  const name = normalizeName(sender);
  const exact = guests.filter((g) => normalizeName(g.name) === name);
  if (exact.length === 1) return { guest: exact[0] ?? null };

  // The contact name may be shorter or longer than the guest list name.
  const partial = guests.filter((g) => {
    const guestName = normalizeName(g.name);
    return guestName.startsWith(`${name} `) || name.startsWith(`${guestName} `);
  });
  if (partial.length === 1) return { guest: partial[0] ?? null };

  // A single first name only counts if just one guest has it.
  if (!name.includes(' ')) {
    const byFirst = guests.filter((g) => normalizeName(g.name).split(' ')[0] === name);
    if (byFirst.length === 1) return { guest: byFirst[0] ?? null };
    if (byFirst.length > 1)
      return { guest: null, problem: 'More than one guest has this first name' };
  }
  return { guest: null, problem: 'No guest with this name' };
}

/** Turns pasted chat text into proposed RSVP changes. Nothing is saved here. */
export function parseReplies(text: string, guests: Guest[]): Reply[] {
  const replies = readMessages(text).map(({ sender, message }): Reply => {
    const { guest, problem } = matchGuest(sender, guests);
    const { intent, plusOne } = detectIntent(message);
    return { sender, message, intent, plusOne, guest, problem };
  });

  // Someone may reply under two names ("Ruwan" and "Ruwan Silva"): the later message wins.
  const lastForGuest = new Map<string, Reply>();
  for (const reply of replies) if (reply.guest) lastForGuest.set(reply.guest.id, reply);
  return replies.filter((reply) => !reply.guest || lastForGuest.get(reply.guest.id) === reply);
}

export function intentToRsvp(intent: Intent): RsvpStatus | null {
  return intent === 'unclear' ? null : intent;
}
