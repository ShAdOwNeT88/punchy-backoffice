/** Dates travel as ISO strings: `YYYY-MM-DD` for days, full ISO for instants. */

export function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(day: string, days: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return isoDate(new Date(y, m - 1, d + days));
}

export function addMonths(day: string, months: number): string {
  const [y, m] = day.split('-').map(Number);
  return isoDate(new Date(y, m - 1 + months, 1));
}

/** First day of the month containing `day`. */
export function monthStart(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = from.split('-').map(Number);
  const [y2, m2, d2] = to.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}
