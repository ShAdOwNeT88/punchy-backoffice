import type {
  BusinessProfileUpdate,
  CardIssue,
  CardProgram,
  CardTemplateInput,
  CardTemplateUpdate,
  CustomerInput,
  PaymentInput,
  PaymentMethod,
  StampInput,
} from '@features/manager/data-access/api/model';

import { addDays, monthStart } from '../dates';
import type { Route, RouteContext } from '../mock-backend';
import { MockError, conflict, notFound, validation } from '../mock-error';
import {
  type BusinessRecord,
  type CardRecord,
  type CustomerRecord,
  type PaymentRecord,
  type TemplateRecord,
  newId,
} from '../mock-db';
import {
  attentionReason,
  cardStatus,
  toBusiness,
  toCard,
  toCustomer,
  toTemplate,
} from '../views';
import { category } from './admin';
import { byName, email, matches, noContent, ok, page, positiveInt, required, text } from './util';

const PROGRAMS: CardProgram[] = ['entries', 'monthly', 'loyalty'];
const METHODS: PaymentMethod[] = ['cash', 'card', 'transfer', 'other'];
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_LOGO_BYTES = 1024 * 1024;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

function myBusiness({ db, user }: RouteContext): BusinessRecord {
  const business = db.businesses.find((b) => b.id === user.businessId);
  if (!business) throw notFound();
  return business;
}

function myTemplate(ctx: RouteContext, id: string): TemplateRecord {
  const t = ctx.db.templates.find((x) => x.id === id && x.businessId === ctx.user.businessId);
  if (!t) throw notFound();
  return t;
}

function myCustomer(ctx: RouteContext, id: string): CustomerRecord {
  const c = ctx.db.customers.find((x) => x.id === id && x.businessId === ctx.user.businessId);
  if (!c) throw notFound();
  return c;
}

function myCard(ctx: RouteContext): CardRecord {
  const card = ctx.db.cards.find(
    (x) => x.id === ctx.params['cardId'] && x.businessId === ctx.user.businessId,
  );
  if (!card) throw notFound();
  return card;
}

function day(value: unknown, field: string, fallback: string): string {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string' || !DAY.test(value)) throw validation(`${field} is not a date`);
  return value;
}

function optionalCents(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw validation(`${field} must be a non-negative integer`);
  }
  return value;
}

function slots(value: unknown): number {
  const n = positiveInt(value, 'totalSlots');
  if (n > 60) throw validation('totalSlots is at most 60');
  return n;
}

function payment(ctx: RouteContext, input: PaymentInput, period?: string): PaymentRecord {
  const amountCents = positiveInt(input.amountCents, 'payment.amountCents');
  if (!METHODS.includes(input.method)) throw validation('payment.method is invalid');
  return {
    id: newId('p'),
    date: day(input.date, 'payment.date', ctx.today),
    amountCents,
    method: input.method,
    period,
    operatorName: `${ctx.user.firstName} ${ctx.user.lastName}`,
    note: text(input.note),
  };
}

function ensureActive(card: CardRecord, today: string) {
  if (cardStatus(card, today) !== 'active') throw conflict('card_not_active');
}

function nextNumber(ctx: RouteContext, business: BusinessRecord): string {
  const taken = new Set(ctx.db.cards.filter((c) => c.businessId === business.id).map((c) => c.number));
  let candidate: string;
  do {
    candidate = String(business.nextCardNumber++).padStart(4, '0');
  } while (taken.has(candidate));
  return candidate;
}

function numberTaken(ctx: RouteContext, number: string, exceptId?: string): boolean {
  return ctx.db.cards.some(
    (c) => c.businessId === ctx.user.businessId && c.number === number && c.id !== exceptId,
  );
}

function issue(ctx: RouteContext, customer: CustomerRecord, template: TemplateRecord): CardRecord {
  return {
    id: newId('k'),
    businessId: template.businessId,
    customerId: customer.id,
    templateId: template.id,
    number: nextNumber(ctx, myBusiness(ctx)),
    program: template.program,
    totalSlots: template.totalSlots,
    priceCents: template.priceCents,
    reward: template.reward,
    printHolder: template.printHolder,
    validUntil: template.validityDays ? addDays(ctx.today, template.validityDays) : undefined,
    issuedAt: ctx.now.toISOString(),
    stamps: [],
    payments: [],
  };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const cardOk = (ctx: RouteContext, card: CardRecord, status = 200) =>
  ok(toCard(ctx.db, card, ctx.today), status);

export const businessRoutes: Route[] = [
  {
    method: 'GET',
    path: '/business',
    role: 'manager',
    handle: (ctx) => ok(toBusiness(ctx.db, myBusiness(ctx), ctx.today)),
  },
  {
    method: 'PATCH',
    path: '/business',
    role: 'manager',
    handle: (ctx) => {
      const business = myBusiness(ctx);
      const input = ctx.body as BusinessProfileUpdate;
      business.category = category(input.category);
      business.tagline = text(input.tagline);
      business.contactName = text(input.contactName);
      business.contactPhone = text(input.contactPhone);
      business.email = email(input.email);
      business.address = text(input.address);
      business.city = text(input.city);
      if (!input.appearance) throw validation('appearance is required');
      business.appearance = { ...input.appearance };
      ctx.touch();
      return ok(toBusiness(ctx.db, business, ctx.today));
    },
  },
  {
    method: 'PUT',
    path: '/business/logo',
    role: 'manager',
    handle: async (ctx) => {
      const business = myBusiness(ctx);
      const file = ctx.body instanceof FormData ? ctx.body.get('file') : null;
      if (!(file instanceof Blob) || !LOGO_TYPES.includes(file.type) || file.size > MAX_LOGO_BYTES) {
        throw new MockError(400, 'logo_invalid');
      }
      business.logoUrl = await readAsDataUrl(file);
      ctx.touch();
      return ok(toBusiness(ctx.db, business, ctx.today));
    },
  },
  {
    method: 'DELETE',
    path: '/business/logo',
    role: 'manager',
    handle: (ctx) => {
      const business = myBusiness(ctx);
      business.logoUrl = undefined;
      ctx.touch();
      return ok(toBusiness(ctx.db, business, ctx.today));
    },
  },
  {
    method: 'GET',
    path: '/business/overview',
    role: 'manager',
    handle: (ctx) => {
      const { db, today, user } = ctx;
      const cards = db.cards.filter((c) => c.businessId === user.businessId);
      const since = addDays(today, -30);
      const month = monthStart(today);
      const stamps = cards.flatMap((c) => c.stamps);
      const urgency = ['reward_ready', 'month_unpaid', 'expiring_soon', 'balance_due', 'almost_used_up'];
      const attention = cards
        .map((card) => ({ card, reason: attentionReason(card, today) }))
        .filter((x): x is { card: CardRecord; reason: NonNullable<typeof x.reason> } => !!x.reason)
        .sort((a, b) => urgency.indexOf(a.reason) - urgency.indexOf(b.reason))
        .map(({ card, reason }) => ({ reason, card: toCard(db, card, today) }));
      return ok({
        customers: db.customers.filter((c) => c.businessId === user.businessId).length,
        activeCards: cards.filter((c) => cardStatus(c, today) === 'active').length,
        stampsToday: stamps.filter((s) => s.date === today).length,
        stampsLast30Days: stamps.filter((s) => s.date >= since).length,
        revenueMonthCents: cards
          .flatMap((c) => c.payments)
          .filter((p) => p.date >= month && p.date <= today)
          .reduce((total, p) => total + p.amountCents, 0),
        attention,
      });
    },
  },

  // Card templates
  {
    method: 'GET',
    path: '/business/templates',
    role: 'manager',
    handle: (ctx) => {
      const all = ctx.query['includeArchived'] === 'true';
      const items = ctx.db.templates
        .filter((t) => t.businessId === ctx.user.businessId && (all || !t.archived))
        .sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name, 'it'))
        .map((t) => toTemplate(ctx.db, t, ctx.today));
      return ok(items);
    },
  },
  {
    method: 'POST',
    path: '/business/templates',
    role: 'manager',
    handle: (ctx) => {
      const input = ctx.body as CardTemplateInput;
      if (!PROGRAMS.includes(input.program)) throw validation('program is invalid');
      const reward = text(input.reward);
      if (input.program === 'loyalty' && !reward) throw validation('reward is required');
      const template: TemplateRecord = {
        id: newId('t'),
        businessId: ctx.user.businessId!,
        name: required(input.name, 'name'),
        program: input.program,
        totalSlots: slots(input.totalSlots),
        priceCents: input.program === 'loyalty' ? undefined : optionalCents(input.priceCents, 'priceCents'),
        reward: input.program === 'loyalty' ? reward : undefined,
        validityDays: input.validityDays ? positiveInt(input.validityDays, 'validityDays') : undefined,
        printHolder: input.printHolder !== false,
        archived: false,
      };
      ctx.db.templates.push(template);
      ctx.touch();
      return ok(toTemplate(ctx.db, template, ctx.today), 201);
    },
  },
  {
    method: 'PATCH',
    path: '/business/templates/:templateId',
    role: 'manager',
    handle: (ctx) => {
      const template = myTemplate(ctx, ctx.params['templateId']);
      const input = ctx.body as CardTemplateUpdate;
      if (input.name !== undefined) template.name = required(input.name, 'name');
      if (input.totalSlots !== undefined) template.totalSlots = slots(input.totalSlots);
      if (input.priceCents !== undefined && template.program !== 'loyalty') {
        template.priceCents = optionalCents(input.priceCents, 'priceCents');
      }
      if (input.reward !== undefined && template.program === 'loyalty') {
        const reward = text(input.reward);
        if (!reward) throw validation('reward is required');
        template.reward = reward;
      }
      if (input.validityDays !== undefined) {
        template.validityDays = input.validityDays ? positiveInt(input.validityDays, 'validityDays') : undefined;
      }
      if (input.printHolder !== undefined) template.printHolder = input.printHolder;
      if (input.archived !== undefined) template.archived = input.archived;
      ctx.touch();
      return ok(toTemplate(ctx.db, template, ctx.today));
    },
  },

  // Customers
  {
    method: 'GET',
    path: '/business/customers',
    role: 'manager',
    handle: (ctx) => {
      const numbers = (id: string) =>
        ctx.db.cards.filter((k) => k.customerId === id).map((k) => k.number).join(' ');
      const items = ctx.db.customers
        .filter((c) => c.businessId === ctx.user.businessId)
        .filter((c) =>
          matches(ctx.query['q'], `${c.firstName} ${c.lastName}`, `${c.lastName} ${c.firstName}`,
            c.email, c.phone, numbers(c.id)),
        )
        .sort(byName)
        .map((c) => toCustomer(ctx.db, c, ctx.today));
      return ok(page(items, ctx.query));
    },
  },
  {
    method: 'POST',
    path: '/business/customers',
    role: 'manager',
    handle: (ctx) => {
      const customer = {
        id: newId('c'),
        businessId: ctx.user.businessId!,
        createdAt: ctx.now.toISOString(),
      } as CustomerRecord;
      applyCustomer(ctx, customer);
      ctx.db.customers.push(customer);
      ctx.touch();
      return ok(toCustomer(ctx.db, customer, ctx.today), 201);
    },
  },
  {
    method: 'GET',
    path: '/business/customers/:customerId',
    role: 'manager',
    handle: (ctx) => ok(toCustomer(ctx.db, myCustomer(ctx, ctx.params['customerId']), ctx.today)),
  },
  {
    method: 'PATCH',
    path: '/business/customers/:customerId',
    role: 'manager',
    handle: (ctx) => {
      const customer = myCustomer(ctx, ctx.params['customerId']);
      applyCustomer(ctx, customer);
      ctx.touch();
      return ok(toCustomer(ctx.db, customer, ctx.today));
    },
  },
  {
    method: 'DELETE',
    path: '/business/customers/:customerId',
    role: 'manager',
    handle: (ctx) => {
      const customer = myCustomer(ctx, ctx.params['customerId']);
      const cards = ctx.db.cards.filter((k) => k.customerId === customer.id);
      if (cards.some((k) => cardStatus(k, ctx.today) === 'active')) {
        throw conflict('customer_has_active_cards');
      }
      ctx.db.cards = ctx.db.cards.filter((k) => k.customerId !== customer.id);
      ctx.db.customers = ctx.db.customers.filter((c) => c.id !== customer.id);
      ctx.touch();
      return noContent();
    },
  },

  // Cards
  {
    method: 'GET',
    path: '/business/cards',
    role: 'manager',
    handle: (ctx) => {
      const { db, today, query } = ctx;
      const customers = new Map(db.customers.map((c) => [c.id, c]));
      const items = db.cards
        .filter((k) => k.businessId === ctx.user.businessId)
        .filter((k) => !query['customerId'] || k.customerId === query['customerId'])
        .filter((k) =>
          !query['group'] ||
          (query['group'] === 'loyalty') === (k.program === 'loyalty'),
        )
        .filter((k) => !query['status'] || cardStatus(k, today) === query['status'])
        .filter((k) => {
          const c = customers.get(k.customerId);
          return matches(query['q'], k.number, c && `${c.firstName} ${c.lastName}`,
            c && `${c.lastName} ${c.firstName}`, c?.email, c?.phone);
        })
        .map((k) => toCard(db, k, today))
        .sort((a, b) =>
          (b.lastStampAt ?? b.issuedAt.slice(0, 10)).localeCompare(a.lastStampAt ?? a.issuedAt.slice(0, 10)),
        );
      return ok(page(items, query));
    },
  },
  {
    method: 'POST',
    path: '/business/cards',
    role: 'manager',
    handle: (ctx) => {
      const input = ctx.body as CardIssue;
      const customer = myCustomer(ctx, required(input.customerId, 'customerId'));
      const template = myTemplate(ctx, required(input.templateId, 'templateId'));
      if (template.archived) throw conflict('template_archived');
      const card = issue(ctx, customer, template);
      const number = text(input.number);
      if (number) {
        if (numberTaken(ctx, number)) throw conflict('card_number_taken');
        card.number = number;
      }
      if (input.validUntil) card.validUntil = day(input.validUntil, 'validUntil', ctx.today);
      const carried = input.stampsAlreadyUsed ?? 0;
      if (!Number.isInteger(carried) || carried < 0 || carried >= card.totalSlots) {
        throw validation('stampsAlreadyUsed is out of range');
      }
      for (let i = 0; i < carried; i++) {
        card.stamps.push({ id: newId('s'), date: ctx.today, note: 'carried_over' });
      }
      if (input.payment) card.payments.push(payment(ctx, input.payment));
      ctx.db.cards.push(card);
      ctx.touch();
      return cardOk(ctx, card, 201);
    },
  },
  {
    method: 'GET',
    path: '/business/cards/:cardId',
    role: 'manager',
    handle: (ctx) => cardOk(ctx, myCard(ctx)),
  },
  {
    method: 'PATCH',
    path: '/business/cards/:cardId',
    role: 'manager',
    handle: (ctx) => {
      const card = myCard(ctx);
      const input = ctx.body as { number?: string; validUntil?: string | null };
      if (input.number !== undefined) {
        const number = required(input.number, 'number');
        if (numberTaken(ctx, number, card.id)) throw conflict('card_number_taken');
        card.number = number;
      }
      if (input.validUntil === null) card.validUntil = undefined;
      else if (input.validUntil !== undefined) card.validUntil = day(input.validUntil, 'validUntil', ctx.today);
      ctx.touch();
      return cardOk(ctx, card);
    },
  },
  {
    method: 'POST',
    path: '/business/cards/:cardId/cancel',
    role: 'manager',
    handle: (ctx) => {
      const card = myCard(ctx);
      card.cancelledAt ??= ctx.now.toISOString();
      ctx.touch();
      return cardOk(ctx, card);
    },
  },
  {
    method: 'POST',
    path: '/business/cards/:cardId/stamps',
    role: 'manager',
    handle: (ctx) => {
      const card = myCard(ctx);
      ensureActive(card, ctx.today);
      if (card.stamps.length >= card.totalSlots) throw conflict('card_full');
      const input = ctx.body as StampInput;
      let period: string | undefined;
      if (card.program === 'monthly') {
        if (!input.period) throw validation('period is required');
        period = monthStart(day(input.period, 'period', ctx.today));
        if (card.stamps.some((s) => s.period === period)) throw conflict('period_already_paid');
      }
      const paid = input.payment ? payment(ctx, input.payment, period) : undefined;
      if (paid) card.payments.push(paid);
      card.stamps.push({
        id: newId('s'),
        date: day(input.date, 'date', ctx.today),
        period,
        amountCents: paid?.amountCents,
        operatorInitials: ctx.user.initials,
        operatorName: `${ctx.user.firstName} ${ctx.user.lastName}`,
        paymentId: paid?.id,
        note: text(input.note),
      });
      ctx.touch();
      return cardOk(ctx, card, 201);
    },
  },
  {
    method: 'DELETE',
    path: '/business/cards/:cardId/stamps/:stampId',
    role: 'manager',
    handle: (ctx) => {
      const card = myCard(ctx);
      const stamp = card.stamps.find((s) => s.id === ctx.params['stampId']);
      if (!stamp) throw notFound();
      if (card.redeemedAt || card.cancelledAt) throw conflict('card_not_active');
      card.stamps = card.stamps.filter((s) => s !== stamp);
      if (stamp.paymentId) card.payments = card.payments.filter((p) => p.id !== stamp.paymentId);
      ctx.touch();
      return cardOk(ctx, card);
    },
  },
  {
    method: 'POST',
    path: '/business/cards/:cardId/payments',
    role: 'manager',
    handle: (ctx) => {
      const card = myCard(ctx);
      if (card.cancelledAt) throw conflict('card_not_active');
      card.payments.push(payment(ctx, ctx.body as PaymentInput));
      ctx.touch();
      return cardOk(ctx, card, 201);
    },
  },
  {
    method: 'DELETE',
    path: '/business/cards/:cardId/payments/:paymentId',
    role: 'manager',
    handle: (ctx) => {
      const card = myCard(ctx);
      const target = card.payments.find((p) => p.id === ctx.params['paymentId']);
      if (!target) throw notFound();
      card.payments = card.payments.filter((p) => p !== target);
      for (const s of card.stamps) {
        if (s.paymentId === target.id) {
          s.paymentId = undefined;
          s.amountCents = undefined;
        }
      }
      ctx.touch();
      return cardOk(ctx, card);
    },
  },
  {
    method: 'POST',
    path: '/business/cards/:cardId/redeem',
    role: 'manager',
    handle: (ctx) => {
      const card = myCard(ctx);
      if (card.program !== 'loyalty' || card.redeemedAt || card.cancelledAt ||
        card.stamps.length < card.totalSlots) {
        throw conflict('reward_not_ready');
      }
      card.redeemedAt = ctx.now.toISOString();
      let renewed: CardRecord | undefined;
      if ((ctx.body as { renew?: boolean }).renew) {
        const template = myTemplate(ctx, card.templateId);
        renewed = issue(ctx, myCustomer(ctx, card.customerId), template);
        ctx.db.cards.push(renewed);
      }
      ctx.touch();
      return ok({
        card: toCard(ctx.db, card, ctx.today),
        renewed: renewed ? toCard(ctx.db, renewed, ctx.today) : undefined,
      });
    },
  },
];

function applyCustomer(ctx: RouteContext, target: CustomerRecord) {
  const input = ctx.body as CustomerInput;
  const address = email(input.email);
  if (
    address &&
    ctx.db.customers.some(
      (c) => c.businessId === ctx.user.businessId && c.email === address && c.id !== target.id,
    )
  ) {
    throw conflict('email_taken');
  }
  target.firstName = required(input.firstName, 'firstName');
  target.lastName = required(input.lastName, 'lastName');
  target.email = address;
  target.phone = text(input.phone);
  target.birthDate = input.birthDate ? day(input.birthDate, 'birthDate', ctx.today) : undefined;
  target.notes = text(input.notes);
}
