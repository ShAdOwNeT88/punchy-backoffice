import type { CardPreviewData } from '@shared/ui/card-preview/card-preview';
import type { Tone } from '@shared/ui/status-chip/status-chip';
import { monthOf } from '@shared/util/format';

import type { AttentionItemReason, Business, Card, CardStatus } from './api/model';

/**
 * How the manager's pages read a card. The rules themselves (status, reward) are the backend's;
 * these helpers only derive what the screens show from the values it sends.
 */

export function remainingSlots(card: Pick<Card, 'totalSlots' | 'stamps'>): number {
  return Math.max(card.totalSlots - card.stamps.length, 0);
}

export function progressPercent(card: Pick<Card, 'totalSlots' | 'stamps'>): number {
  return card.totalSlots ? Math.min(100, Math.round((card.stamps.length / card.totalSlots) * 100)) : 0;
}

/** What is still owed on the price of an entries package; 0 when paid or not applicable. */
export function balanceDue(card: Pick<Card, 'program' | 'priceCents' | 'paidCents'>): number {
  if (card.program !== 'entries' || !card.priceCents) return 0;
  return Math.max(card.priceCents - card.paidCents, 0);
}

export function statusTone(status: CardStatus): Tone {
  switch (status) {
    case 'active':
      return 'success';
    case 'completed':
      return 'info';
    case 'expired':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function attentionTone(reason: AttentionItemReason): Tone {
  switch (reason) {
    case 'reward_ready':
      return 'success';
    case 'month_unpaid':
    case 'balance_due':
      return 'error';
    default:
      return 'warning';
  }
}

/**
 * The months a monthly card can be paid for, from three months back to two ahead, with the
 * ones already stamped marked. The first unpaid month from the current one is suggested.
 */
export function payableMonths(card: Pick<Card, 'stamps'>, today: string) {
  const paid = new Set(card.stamps.map((s) => s.period).filter(Boolean));
  const months = [-3, -2, -1, 0, 1, 2].map((offset) => {
    const period = monthOf(today, offset);
    return { period, paid: paid.has(period) };
  });
  const current = monthOf(today);
  const suggested =
    months.find((m) => !m.paid && m.period >= current)?.period ??
    months.find((m) => !m.paid)?.period ??
    null;
  return { months, suggested };
}

/** The card as the customer sees it in the app. */
export function toPreview(card: Card, business: Business): CardPreviewData {
  return {
    issuerName: business.name,
    category: business.category,
    emblem: business.appearance.emblem,
    logoUrl: business.logoUrl,
    tagline: business.tagline,
    contactName: business.contactName,
    contactPhone: business.contactPhone,
    style: business.appearance.style,
    design: business.appearance.design,
    stampStyle: business.appearance.stampStyle,
    program: card.program,
    totalSlots: card.totalSlots,
    number: card.number,
    holder: card.printHolder ? `${card.customer.firstName} ${card.customer.lastName}` : undefined,
    reward: card.reward,
    validUntil: card.validUntil,
    stamps: card.stamps,
  };
}
