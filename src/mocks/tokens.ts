import type { UserRecord } from './mock-db';

const TOKEN_PREFIX = 'mock.';

export function tokenFor(user: UserRecord): string {
  return `${TOKEN_PREFIX}${user.id}`;
}

export function userIdFrom(token: string | null): string | null {
  return token?.startsWith(TOKEN_PREFIX) ? token.slice(TOKEN_PREFIX.length) : null;
}
