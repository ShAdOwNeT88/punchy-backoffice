import type { Route } from '../mock-backend';
import { tokenFor } from '../tokens';
import { MockError } from '../mock-error';
import type { MockDb, UserRecord } from '../mock-db';
import { ok, text } from './util';

export function toUser(db: MockDb, u: UserRecord) {
  const business = db.businesses.find((b) => b.id === u.businessId);
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: u.role,
    initials: u.initials,
    businessId: u.businessId,
    businessName: business?.name,
  };
}

export const authRoutes: Route[] = [
  {
    method: 'POST',
    path: '/auth/login',
    role: 'public',
    handle: ({ db, body, now, touch }) => {
      const { email, password } = body as { email?: string; password?: string };
      const user = db.users.find((u) => u.email === text(email)?.toLowerCase());
      if (!user || user.password !== password) throw new MockError(401, 'invalid_credentials');
      if (user.status === 'suspended') throw new MockError(403, 'account_suspended');
      if (user.role === 'manager') {
        const business = db.businesses.find((b) => b.id === user.businessId);
        if (business?.status !== 'active') throw new MockError(403, 'business_suspended');
      }
      user.lastLoginAt = now.toISOString();
      touch();
      return ok({ token: tokenFor(user), user: toUser(db, user) });
    },
  },
];
