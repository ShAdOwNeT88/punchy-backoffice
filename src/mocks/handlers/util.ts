import { validation } from '../mock-error';

export const ok = (body: unknown, status = 200) => ({ status, body });
export const noContent = () => ({ status: 204, body: null });

/** Trimmed string, or `undefined` when empty or absent. */
export function text(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function required(value: unknown, field: string): string {
  const result = text(value);
  if (!result) throw validation(`${field} is required`);
  return result;
}

export function positiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw validation(`${field} must be a positive integer`);
  }
  return value;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function email(value: unknown, field = 'email'): string | undefined {
  const result = text(value)?.toLowerCase();
  if (result && !EMAIL.test(result)) throw validation(`${field} is not an email`);
  return result;
}

export function matches(query: string | undefined, ...fields: (string | undefined)[]): boolean {
  const q = text(query)?.toLowerCase();
  if (!q) return true;
  return fields.some((f) => f?.toLowerCase().includes(q));
}

export function page<T>(items: T[], query: Record<string, string>) {
  const pageIndex = Math.max(0, Number(query['page'] ?? 0) || 0);
  const pageSize = Math.min(100, Math.max(1, Number(query['pageSize'] ?? 20) || 20));
  return {
    items: items.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize),
    total: items.length,
    page: pageIndex,
    pageSize,
  };
}

export const byName = (a: { lastName: string; firstName: string }, b: typeof a) =>
  a.lastName.localeCompare(b.lastName, 'it') || a.firstName.localeCompare(b.firstName, 'it');
