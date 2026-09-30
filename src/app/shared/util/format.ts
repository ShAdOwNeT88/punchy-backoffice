/** Locale-aware formatting of the values the API sends: cents, ISO days and instants. */

const LOCALES: Record<string, string> = { it: 'it-IT', en: 'en-GB' };

export function locale(lang: string): string {
  return LOCALES[lang] ?? LOCALES['it'];
}

export function formatMoney(cents: number | null | undefined, lang: string): string {
  if (cents === null || cents === undefined) return '';
  return new Intl.NumberFormat(locale(lang), { style: 'currency', currency: 'EUR' }).format(
    cents / 100,
  );
}

/** Parses `YYYY-MM-DD` as a local day, or a full ISO instant. */
export function parseDay(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

export type DateStyle = 'short' | 'medium' | 'long';

export function formatDay(value: string | null | undefined, lang: string, style: DateStyle = 'medium'): string {
  if (!value) return '';
  const options: Intl.DateTimeFormatOptions =
    style === 'short'
      ? { day: '2-digit', month: '2-digit' }
      : style === 'long'
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : { day: '2-digit', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(locale(lang), options).format(parseDay(value));
}

export function formatMonth(value: string | null | undefined, lang: string): string {
  if (!value) return '';
  const text = new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(
    parseDay(value),
  );
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Today as `YYYY-MM-DD`, in local time. */
export function today(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** First day of the month `offset` months away from the month of `day`. */
export function monthOf(day: string, offset = 0): string {
  const [y, m] = day.split('-').map(Number);
  const date = new Date(y, m - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Converts a euro amount typed by a user (`12,50` or `12.5`) into cents. */
export function toCents(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function fromCents(cents: number | null | undefined): number | null {
  return cents === null || cents === undefined ? null : cents / 100;
}
