import type { Business, Manager } from '@features/admin/data-access/api/model';
import type {
  AttentionItem,
  Card,
  CardStatus,
  CardTemplate,
  Customer,
} from '@features/manager/data-access/api/model';

import { daysBetween, monthStart } from './dates';
import type {
  BusinessRecord,
  CardRecord,
  CustomerRecord,
  MockDb,
  TemplateRecord,
  UserRecord,
} from './mock-db';

/** Rules the backend applies to a card; the back office only displays their outcome. */
export function cardStatus(card: CardRecord, today: string): CardStatus {
  if (card.cancelledAt) return 'cancelled';
  if (card.redeemedAt) return 'completed';
  if (card.program !== 'loyalty' && card.stamps.length >= card.totalSlots) return 'completed';
  if (card.validUntil && card.validUntil < today) return 'expired';
  return 'active';
}

export function rewardReady(card: CardRecord): boolean {
  return (
    card.program === 'loyalty' &&
    !card.cancelledAt &&
    !card.redeemedAt &&
    card.stamps.length >= card.totalSlots
  );
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function toCard(db: MockDb, card: CardRecord, today: string): Card {
  const customer = db.customers.find((c) => c.id === card.customerId);
  const template = db.templates.find((t) => t.id === card.templateId);
  const stamps = [...card.stamps].sort((a, b) => a.date.localeCompare(b.date));
  return {
    id: card.id,
    number: card.number,
    templateId: card.templateId,
    templateName: template?.name ?? '',
    program: card.program,
    totalSlots: card.totalSlots,
    priceCents: card.priceCents,
    reward: card.reward,
    printHolder: card.printHolder,
    validUntil: card.validUntil,
    customer: {
      id: card.customerId,
      firstName: customer?.firstName ?? '',
      lastName: customer?.lastName ?? '',
    },
    status: cardStatus(card, today),
    rewardReady: rewardReady(card),
    issuedAt: card.issuedAt,
    lastStampAt: stamps.at(-1)?.date,
    redeemedAt: card.redeemedAt,
    stamps,
    payments: [...card.payments].sort((a, b) => a.date.localeCompare(b.date)),
    paidCents: sum(card.payments.map((p) => p.amountCents)),
  };
}

export function toBusiness(db: MockDb, b: BusinessRecord, today: string): Business {
  const { nextCardNumber: _, ...rest } = b;
  return {
    ...rest,
    managerCount: db.users.filter((u) => u.businessId === b.id).length,
    customerCount: db.customers.filter((c) => c.businessId === b.id).length,
    activeCardCount: db.cards.filter((c) => c.businessId === b.id && cardStatus(c, today) === 'active')
      .length,
  };
}

export function toManager(db: MockDb, u: UserRecord): Manager {
  const business = db.businesses.find((b) => b.id === u.businessId);
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    initials: u.initials,
    phone: u.phone,
    businessId: u.businessId ?? '',
    businessName: business?.name ?? '',
    status: u.status,
    businessStatus: business?.status ?? 'active',
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
  };
}

export function toCustomer(db: MockDb, c: CustomerRecord, today: string): Customer {
  const cards = db.cards.filter((k) => k.customerId === c.id);
  const lastVisit = cards
    .flatMap((k) => k.stamps.map((s) => s.date))
    .sort()
    .at(-1);
  return {
    ...c,
    activeCardCount: cards.filter((k) => cardStatus(k, today) === 'active').length,
    lastVisitAt: lastVisit ? `${lastVisit}T00:00:00.000Z` : undefined,
  };
}

export function toTemplate(db: MockDb, t: TemplateRecord, today: string): CardTemplate {
  const { businessId: _, ...rest } = t;
  return {
    ...rest,
    activeCardCount: db.cards.filter((k) => k.templateId === t.id && cardStatus(k, today) === 'active')
      .length,
  };
}

/** Why a card needs staff action, if it does. The order of the checks is the urgency. */
export function attentionReason(card: CardRecord, today: string): AttentionItem['reason'] | null {
  if (rewardReady(card)) return 'reward_ready';
  if (cardStatus(card, today) !== 'active') return null;
  if (card.program === 'monthly' && !card.stamps.some((s) => s.period === monthStart(today))) {
    return 'month_unpaid';
  }
  if (card.validUntil && daysBetween(today, card.validUntil) <= 14) return 'expiring_soon';
  const paid = sum(card.payments.map((p) => p.amountCents));
  if (card.program === 'entries' && card.priceCents && paid < card.priceCents) return 'balance_due';
  if (card.program === 'entries' && card.totalSlots - card.stamps.length <= 2) return 'almost_used_up';
  return null;
}
