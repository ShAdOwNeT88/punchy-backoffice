import type {
  AccountStatus,
  Appearance,
  BusinessInput,
  IssuerCategory,
} from '@features/admin/data-access/api/model';

import { addDays } from '../dates';
import type { Route, RouteContext } from '../mock-backend';
import { conflict, notFound, validation } from '../mock-error';
import { type BusinessRecord, type UserRecord, newId } from '../mock-db';
import { cardStatus, toBusiness, toManager } from '../views';
import { byName, email, matches, noContent, ok, page, required, text } from './util';

const CATEGORIES: IssuerCategory[] = [
  'pool', 'gym', 'studio', 'cafe', 'restaurant', 'shop', 'beauty', 'other',
];
const DEFAULT_APPEARANCE: Appearance = { style: 'ocean', design: 'gradient', stampStyle: 'round' };

export function category(value: unknown): IssuerCategory {
  if (!CATEGORIES.includes(value as IssuerCategory)) throw validation('category is invalid');
  return value as IssuerCategory;
}

function status(value: unknown): AccountStatus {
  if (value !== 'active' && value !== 'suspended') throw validation('status is invalid');
  return value;
}

function findBusiness({ db, params }: RouteContext): BusinessRecord {
  const business = db.businesses.find((b) => b.id === params['businessId']);
  if (!business) throw notFound();
  return business;
}

function findManager({ db, params }: RouteContext): UserRecord {
  const user = db.users.find((u) => u.id === params['managerId'] && u.role === 'manager');
  if (!user) throw notFound();
  return user;
}

function applyBusinessInput(target: Partial<BusinessRecord>, body: unknown) {
  const input = body as BusinessInput;
  target.name = required(input.name, 'name');
  target.category = category(input.category);
  target.tagline = text(input.tagline);
  target.contactName = text(input.contactName);
  target.contactPhone = text(input.contactPhone);
  target.email = email(input.email);
  target.address = text(input.address);
  target.city = text(input.city);
  target.vatNumber = text(input.vatNumber);
  if (input.appearance) target.appearance = { ...input.appearance };
}

function applyManagerInput(ctx: RouteContext, target: Partial<UserRecord>) {
  const input = ctx.body as Record<string, unknown>;
  const address = email(input['email']);
  if (!address) throw validation('email is required');
  if (ctx.db.users.some((u) => u.email === address && u.id !== target.id)) {
    throw conflict('email_taken');
  }
  const businessId = required(input['businessId'], 'businessId');
  if (!ctx.db.businesses.some((b) => b.id === businessId)) throw validation('businessId is unknown');
  target.email = address;
  target.firstName = required(input['firstName'], 'firstName');
  target.lastName = required(input['lastName'], 'lastName');
  target.initials = text(input['initials'])?.slice(0, 3);
  target.phone = text(input['phone']);
  target.businessId = businessId;
}

function password(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length < 8) throw validation(`${field} too short`);
  return value;
}

export const adminRoutes: Route[] = [
  {
    method: 'GET',
    path: '/admin/overview',
    role: 'admin',
    handle: ({ db, today }) => {
      const since = addDays(today, -30);
      return ok({
        businesses: db.businesses.length,
        suspendedBusinesses: db.businesses.filter((b) => b.status === 'suspended').length,
        managers: db.users.filter((u) => u.role === 'manager').length,
        customers: db.customers.length,
        activeCards: db.cards.filter((c) => cardStatus(c, today) === 'active').length,
        stampsLast30Days: db.cards.flatMap((c) => c.stamps).filter((s) => s.date >= since).length,
        recentBusinesses: [...db.businesses]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5)
          .map((b) => toBusiness(db, b, today)),
      });
    },
  },
  {
    method: 'GET',
    path: '/admin/businesses',
    role: 'admin',
    handle: ({ db, today, query }) => {
      const items = db.businesses
        .filter((b) => !query['status'] || b.status === query['status'])
        .filter((b) => matches(query['q'], b.name, b.city, b.email, b.vatNumber, b.contactPhone))
        .sort((a, b) => a.name.localeCompare(b.name, 'it'))
        .map((b) => toBusiness(db, b, today));
      return ok(page(items, query));
    },
  },
  {
    method: 'POST',
    path: '/admin/businesses',
    role: 'admin',
    handle: ({ db, today, now, body, touch }) => {
      const business = {
        id: newId('b'),
        status: 'active',
        createdAt: now.toISOString(),
        nextCardNumber: 1,
        appearance: DEFAULT_APPEARANCE,
      } as BusinessRecord;
      applyBusinessInput(business, body);
      db.businesses.push(business);
      touch();
      return ok(toBusiness(db, business, today), 201);
    },
  },
  {
    method: 'GET',
    path: '/admin/businesses/:businessId',
    role: 'admin',
    handle: (ctx) => ok(toBusiness(ctx.db, findBusiness(ctx), ctx.today)),
  },
  {
    method: 'PATCH',
    path: '/admin/businesses/:businessId',
    role: 'admin',
    handle: (ctx) => {
      const business = findBusiness(ctx);
      applyBusinessInput(business, ctx.body);
      ctx.touch();
      return ok(toBusiness(ctx.db, business, ctx.today));
    },
  },
  {
    method: 'PUT',
    path: '/admin/businesses/:businessId/status',
    role: 'admin',
    handle: (ctx) => {
      const business = findBusiness(ctx);
      business.status = status((ctx.body as { status?: unknown }).status);
      ctx.touch();
      return ok(toBusiness(ctx.db, business, ctx.today));
    },
  },
  {
    method: 'GET',
    path: '/admin/managers',
    role: 'admin',
    handle: ({ db, query }) => {
      const items = db.users
        .filter((u) => u.role === 'manager')
        .filter((u) => !query['businessId'] || u.businessId === query['businessId'])
        .filter((u) => !query['status'] || u.status === query['status'])
        .filter((u) => matches(query['q'], `${u.firstName} ${u.lastName}`, u.email, u.phone))
        .sort(byName)
        .map((u) => toManager(db, u));
      return ok(page(items, query));
    },
  },
  {
    method: 'POST',
    path: '/admin/managers',
    role: 'admin',
    handle: (ctx) => {
      const user = {
        id: newId('u'),
        role: 'manager',
        status: 'active',
        createdAt: ctx.now.toISOString(),
      } as UserRecord;
      applyManagerInput(ctx, user);
      user.password = password((ctx.body as Record<string, unknown>)['temporaryPassword'], 'temporaryPassword');
      ctx.db.users.push(user);
      ctx.touch();
      return ok(toManager(ctx.db, user), 201);
    },
  },
  {
    method: 'PATCH',
    path: '/admin/managers/:managerId',
    role: 'admin',
    handle: (ctx) => {
      const user = findManager(ctx);
      applyManagerInput(ctx, user);
      ctx.touch();
      return ok(toManager(ctx.db, user));
    },
  },
  {
    method: 'PUT',
    path: '/admin/managers/:managerId/status',
    role: 'admin',
    handle: (ctx) => {
      const user = findManager(ctx);
      user.status = status((ctx.body as { status?: unknown }).status);
      ctx.touch();
      return ok(toManager(ctx.db, user));
    },
  },
  {
    method: 'PUT',
    path: '/admin/managers/:managerId/password',
    role: 'admin',
    handle: (ctx) => {
      const user = findManager(ctx);
      user.password = password((ctx.body as Record<string, unknown>)['temporaryPassword'], 'temporaryPassword');
      ctx.touch();
      return noContent();
    },
  },
];
