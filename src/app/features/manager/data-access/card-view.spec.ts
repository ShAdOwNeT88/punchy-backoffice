import type { Business, Card } from './api/model';
import {
  attentionTone,
  balanceDue,
  payableMonths,
  progressPercent,
  remainingSlots,
  statusTone,
  toPreview,
} from './card-view';

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'k',
    number: '0001',
    templateId: 't',
    templateName: 'Pacchetto',
    program: 'entries',
    totalSlots: 10,
    priceCents: 9000,
    printHolder: true,
    customer: { id: 'c', firstName: 'Mario', lastName: 'Rossi' },
    status: 'active',
    rewardReady: false,
    issuedAt: '2026-09-01T09:00:00Z',
    stamps: [],
    payments: [],
    paidCents: 0,
    ...overrides,
  };
}

const stamp = (date: string, period?: string) => ({ id: date, date, period });

describe('card view', () => {
  it('counts remaining boxes and progress', () => {
    const c = card({ stamps: [stamp('2026-09-01'), stamp('2026-09-02')] });
    expect(remainingSlots(c)).toBe(8);
    expect(progressPercent(c)).toBe(20);
    expect(remainingSlots(card({ totalSlots: 1, stamps: [stamp('a'), stamp('b')] }))).toBe(0);
  });

  it('owes the rest of an entries package only', () => {
    expect(balanceDue(card({ paidCents: 5000 }))).toBe(4000);
    expect(balanceDue(card({ paidCents: 9500 }))).toBe(0);
    expect(balanceDue(card({ program: 'monthly', paidCents: 0 }))).toBe(0);
  });

  it('suggests the first unpaid month from the current one', () => {
    const c = card({ program: 'monthly', stamps: [stamp('2026-09-03', '2026-09-01')] });
    const { months, suggested } = payableMonths(c, '2026-09-30');
    expect(months.map((m) => m.period)).toEqual([
      '2026-06-01', '2026-07-01', '2026-08-01', '2026-09-01', '2026-10-01', '2026-11-01',
    ]);
    expect(months.find((m) => m.period === '2026-09-01')?.paid).toBe(true);
    expect(suggested).toBe('2026-10-01');
  });

  it('falls back to an earlier unpaid month, or none', () => {
    const future = ['2026-09-01', '2026-10-01', '2026-11-01'].map((p) => stamp(p, p));
    expect(payableMonths(card({ stamps: future }), '2026-09-30').suggested).toBe('2026-06-01');
    const all = ['06', '07', '08', '09', '10', '11'].map((m) => stamp(`2026-${m}-01`, `2026-${m}-01`));
    expect(payableMonths(card({ stamps: all }), '2026-09-30').suggested).toBeNull();
  });

  it('has no progress without boxes', () => {
    expect(progressPercent(card({ totalSlots: 0 }))).toBe(0);
    expect(balanceDue(card({ priceCents: undefined }))).toBe(0);
  });

  it('maps states to tones', () => {
    expect(statusTone('completed')).toBe('info');
    expect(attentionTone('balance_due')).toBe('error');
    expect(statusTone('active')).toBe('success');
    expect(statusTone('expired')).toBe('warning');
    expect(statusTone('cancelled')).toBe('neutral');
    expect(attentionTone('reward_ready')).toBe('success');
    expect(attentionTone('month_unpaid')).toBe('error');
    expect(attentionTone('expiring_soon')).toBe('warning');
  });

  it('prints the holder only when the template says so', () => {
    const business = {
      name: 'Life',
      category: 'pool',
      appearance: { style: 'ocean', design: 'paper', stampStyle: 'signature' },
    } as Business;
    expect(toPreview(card(), business).holder).toBe('Mario Rossi');
    expect(toPreview(card({ printHolder: false, reward: 'Caffè' }), business)).toMatchObject({
      holder: undefined,
      reward: 'Caffè',
      design: 'paper',
    });
  });
});
