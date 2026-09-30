import { isoDate } from './dates';
import { userIdFrom } from './tokens';
import { MockError } from './mock-error';
import { type MockDb, type UserRecord, loadDb, saveDb } from './mock-db';
import { accountRoutes } from './handlers/account';
import { adminRoutes } from './handlers/admin';
import { authRoutes } from './handlers/auth';
import { businessRoutes } from './handlers/business';

export interface MockRequest {
  method: string;
  /** Path relative to the API base URL, e.g. `/business/cards/k-1`. */
  path: string;
  query: Record<string, string>;
  body: unknown;
  token: string | null;
}

export interface MockResponse {
  status: number;
  body: unknown;
}

export interface RouteContext {
  db: MockDb;
  today: string;
  now: Date;
  user: UserRecord;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  /** Marks the request as changing data, so the database is saved. */
  touch(): void;
}

export interface Route {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  /** Who may call it; `public` needs no token. */
  role: 'public' | 'any' | 'admin' | 'manager';
  handle(ctx: RouteContext): MockResponse | Promise<MockResponse>;
}

const ROUTES: Route[] = [
  ...authRoutes,
  ...accountRoutes,
  ...adminRoutes,
  ...businessRoutes,
];

/**
 * In-memory implementation of `openapi/punchy.yaml`, persisted in localStorage. It stands in for
 * the backend until one exists and applies the same rules the contract describes.
 */
export class MockBackend {
  private db: MockDb;

  constructor(private readonly clock: () => Date = () => new Date()) {
    this.db = loadDb(clock());
  }

  async handle(request: MockRequest): Promise<MockResponse> {
    try {
      const match = this.match(request.method, request.path);
      if (!match) throw new MockError(404, 'not_found', `${request.method} ${request.path}`);
      const { route, params } = match;
      const now = this.clock();
      let dirty = false;
      const ctx: RouteContext = {
        db: this.db,
        today: isoDate(now),
        now,
        user: route.role === 'public' ? (undefined as unknown as UserRecord) : this.authorize(request.token, route),
        params,
        query: request.query,
        body: request.body ?? {},
        touch: () => (dirty = true),
      };
      const response = await route.handle(ctx);
      if (dirty) saveDb(this.db);
      return response;
    } catch (error) {
      if (error instanceof MockError) {
        return { status: error.status, body: { code: error.code, message: error.message } };
      }
      throw error;
    }
  }

  private match(method: string, path: string) {
    const segments = path.split('/').filter(Boolean);
    for (const route of ROUTES) {
      if (route.method !== method.toUpperCase()) continue;
      const pattern = route.path.split('/').filter(Boolean);
      if (pattern.length !== segments.length) continue;
      const params: Record<string, string> = {};
      const ok = pattern.every((part, i) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = decodeURIComponent(segments[i]);
          return true;
        }
        return part === segments[i];
      });
      if (ok) return { route, params };
    }
    return null;
  }

  /** Resolves the caller from the token; suspension ends the session on the next request. */
  private authorize(token: string | null, route: Route): UserRecord {
    const id = userIdFrom(token);
    const user = this.db.users.find((u) => u.id === id);
    if (!user) throw new MockError(401, 'unauthorized');
    if (user.status === 'suspended') throw new MockError(401, 'account_suspended');
    if (user.role === 'manager') {
      const business = this.db.businesses.find((b) => b.id === user.businessId);
      if (business?.status !== 'active') throw new MockError(401, 'business_suspended');
    }
    if (route.role !== 'any' && route.role !== user.role) throw new MockError(403, 'forbidden');
    return user;
  }
}
