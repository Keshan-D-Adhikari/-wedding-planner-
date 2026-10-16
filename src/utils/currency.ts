import { CURRENCY_CODES, type CurrencyCode } from '@/types';

export interface CurrencyOption {
  code: CurrencyCode;
  label: string;
  locale: string;
}

export const CURRENCIES: readonly CurrencyOption[] = [
  { code: 'LKR', label: 'Sri Lankan Rupee (Rs)', locale: 'en-LK' },
  { code: 'USD', label: 'US Dollar ($)', locale: 'en-US' },
  { code: 'GBP', label: 'British Pound (£)', locale: 'en-GB' },
  { code: 'EUR', label: 'Euro (€)', locale: 'en-IE' },
  { code: 'INR', label: 'Indian Rupee (₹)', locale: 'en-IN' },
  { code: 'AUD', label: 'Australian Dollar (A$)', locale: 'en-AU' },
  { code: 'CAD', label: 'Canadian Dollar (C$)', locale: 'en-CA' },
];

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (CURRENCY_CODES as readonly string[]).includes(value);
}

const EURO_REGIONS = ['DE', 'FR', 'IE', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'FI', 'GR', 'LU'];

/** Best guess at the visitor's currency from their time zone and browser language. */
export function guessCurrency(): CurrencyCode {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone === 'Asia/Colombo') return 'LKR';
    if (timeZone === 'Asia/Kolkata' || timeZone === 'Asia/Calcutta') return 'INR';
    if (timeZone.startsWith('Australia/')) return 'AUD';

    const region = new Intl.Locale(navigator.language).maximize().region ?? '';
    if (region === 'LK') return 'LKR';
    if (region === 'IN') return 'INR';
    if (region === 'GB') return 'GBP';
    if (region === 'AU') return 'AUD';
    if (region === 'CA') return 'CAD';
    if (EURO_REGIONS.includes(region)) return 'EUR';
  } catch {
    /* fall through to default */
  }
  return 'USD';
}

// Intl.NumberFormat is relatively expensive to create, so cache one per currency.
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(currency: CurrencyCode, compact: boolean): Intl.NumberFormat {
  const key = `${currency}:${compact ? 'c' : 'f'}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    const locale = CURRENCIES.find((c) => c.code === currency)?.locale ?? 'en-US';
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: compact ? 1 : 0,
      notation: compact ? 'compact' : 'standard',
    });
    formatterCache.set(key, formatter);
  }
  return formatter;
}

/** formatCurrency(125000, 'LKR') → "Rs 125,000" */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
  return getFormatter(currency, false).format(Number.isFinite(amount) ? amount : 0);
}

/** formatCurrencyCompact(1250000, 'USD') → "$1.3M" — for small chart labels */
export function formatCurrencyCompact(amount: number, currency: CurrencyCode): string {
  return getFormatter(currency, true).format(Number.isFinite(amount) ? amount : 0);
}
