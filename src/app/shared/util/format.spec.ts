import { HttpErrorResponse } from '@angular/common/http';

import { gridColumns } from '../ui/card-preview/card-preview';
import { apiErrorCode, apiErrorKey } from './api-error';
import { formatDay, formatMoney, formatMonth, fromCents, monthOf, parseDay, toCents, today } from './format';
import { categoryIcon, emblemIcon } from './icons';

describe('format', () => {
  it('formats cents as euros in the active language', () => {
    expect(formatMoney(4500, 'it')).toMatch(/45,00\s€/);
    expect(formatMoney(4500, 'en')).toBe('€45.00');
    expect(formatMoney(undefined, 'it')).toBe('');
  });

  it('parses an ISO day as a local date', () => {
    const d = parseDay('2026-01-05');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 0, 5]);
  });

  it('formats days and months', () => {
    expect(formatDay('2026-09-30', 'it', 'short')).toBe('30/09');
    expect(formatDay('2026-09-30', 'en', 'long')).toBe('30 September 2026');
    expect(formatDay(null, 'it')).toBe('');
    expect(formatMonth('2026-09-01', 'it')).toBe('Settembre 2026');
    expect(formatMonth(undefined, 'it')).toBe('');
  });

  it('moves between months across years', () => {
    expect(monthOf('2026-12-15', 1)).toBe('2027-01-01');
    expect(monthOf('2026-01-31', -1)).toBe('2025-12-01');
    expect(today(new Date(2026, 8, 3))).toBe('2026-09-03');
  });

  it('converts typed euro amounts to cents and back', () => {
    expect(toCents('12,50')).toBe(1250);
    expect(toCents(45)).toBe(4500);
    expect(toCents('')).toBeNull();
    expect(toCents('abc')).toBeNull();
    expect(fromCents(1250)).toBe(12.5);
    expect(fromCents(undefined)).toBeNull();
  });
});

describe('api errors', () => {
  it('reads the stable code of an ApiError', () => {
    const error = new HttpErrorResponse({ status: 409, error: { code: 'card_full' } });
    expect(apiErrorCode(error)).toBe('card_full');
    expect(apiErrorKey(error)).toBe('errors.card_full');
  });

  it('maps unreachable servers and unknown codes', () => {
    expect(apiErrorKey(new HttpErrorResponse({ status: 0 }))).toBe('errors.network');
    expect(apiErrorKey(new HttpErrorResponse({ status: 500, error: { code: 'boom' } }))).toBe('errors.unknown');
    expect(apiErrorCode(new Error('x'))).toBe('unknown');
  });
});

describe('icons', () => {
  it('falls back from emblem to category to the generic icon', () => {
    expect(emblemIcon('wave', 'pool')).toBe('waves');
    expect(emblemIcon(undefined, 'gym')).toBe('fitness_center');
    expect(categoryIcon('unknown')).toBe('confirmation_number');
  });
});

describe('card grid', () => {
  it('lays the boxes out like the paper cards', () => {
    expect(gridColumns(12)).toBe(4);
    expect(gridColumns(10)).toBe(5);
    expect(gridColumns(6)).toBe(3);
    expect(gridColumns(4)).toBe(4);
    expect(gridColumns(7)).toBe(5);
  });
});
