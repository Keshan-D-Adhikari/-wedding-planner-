import type { CurrencyCode } from '@/types';

/** A reasonable starting country code, guessed from the wedding's currency. */
const COUNTRY_CODE_BY_CURRENCY: Partial<Record<CurrencyCode, string>> = {
  LKR: '94',
  INR: '91',
  GBP: '44',
  USD: '1',
  CAD: '1',
  AUD: '61',
};

export function defaultCountryCode(currency: CurrencyCode): string {
  return COUNTRY_CODE_BY_CURRENCY[currency] ?? '';
}

/** Keeps digits only, so "+94 (77) 123-4567" and "9477 123 4567" compare equal. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Turns a phone number as people type it into the international digits WhatsApp
 * needs (no "+", no spaces): "077 123 4567" with country code "94" → "94771234567".
 * Returns null when it can't be a real number.
 */
export function toWhatsAppNumber(phone: string, countryCode: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  let digits = digitsOnly(trimmed);
  const cc = digitsOnly(countryCode);

  if (trimmed.startsWith('+')) {
    // already international
  } else if (digits.startsWith('00')) {
    digits = digits.slice(2);
  } else if (cc) {
    // Local number: drop the leading trunk "0" and add the country code.
    digits = digits.startsWith('0')
      ? cc + digits.slice(1)
      : digits.startsWith(cc)
        ? digits
        : cc + digits;
  }
  // A local number (leading 0) with no country code can't be dialled from WhatsApp.
  if (!trimmed.startsWith('+') && !cc && digits.startsWith('0')) return null;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

/**
 * A link that opens WhatsApp with the message ready to send. Without a number,
 * WhatsApp lets you pick the contact yourself.
 */
export function whatsAppLink(number: string | null, message: string): string {
  const text = encodeURIComponent(message);
  return number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
}
