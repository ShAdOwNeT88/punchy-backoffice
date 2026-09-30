import { MockBackend, type MockRequest } from './mock-backend';
import { clearDb } from './mock-db';
import { DEMO_ACCOUNTS, DEMO_PASSWORDS } from './seed';

const NOW = new Date(2026, 8, 30, 10, 0, 0);

interface Body {
  code?: string;
  [key: string]: unknown;
}

describe('MockBackend', () => {
  let backend: MockBackend;

  beforeEach(() => {
    clearDb();
    backend = new MockBackend(() => NOW);
  });

  async function call(method: string, path: string, body?: unknown, token: string | null = null, query = {}) {
    const request: MockRequest = { method, path, body, token, query };
    const response = await backend.handle(request);
    return { status: response.status, body: response.body as Body };
  }

  async function login(email: string, password: string) {
    const { body } = await call('POST', '/auth/login', { email, password });
    return body['token'] as string;
  }

  const admin = () => login(DEMO_ACCOUNTS.admin, DEMO_PASSWORDS.admin);
  const manager = () => login(DEMO_ACCOUNTS.manager, DEMO_PASSWORDS.manager);

  describe('auth', () => {
    it('signs in a manager with their business', async () => {
      const { status, body } = await call('POST', '/auth/login', {
        email: DEMO_ACCOUNTS.manager.toUpperCase(),
        password: DEMO_PASSWORDS.manager,
      });
      expect(status).toBe(200);
      expect(body['user']).toMatchObject({ role: 'manager', businessId: 'b-life', businessName: 'Life' });
    });

    it('rejects a wrong password', async () => {
      const { status, body } = await call('POST', '/auth/login', { email: DEMO_ACCOUNTS.admin, password: 'nope-nope' });
      expect(status).toBe(401);
      expect(body.code).toBe('invalid_credentials');
    });

    it('rejects managers of a suspended business', async () => {
      const { status, body } = await call('POST', '/auth/login', {
        email: 'chiara.ferri@example.com',
        password: DEMO_PASSWORDS.manager,
      });
      expect(status).toBe(403);
      expect(body.code).toBe('business_suspended');
    });

    it('rejects a suspended manager', async () => {
      const { body } = await call('POST', '/auth/login', {
        email: 'monica.vairo@example.com',
        password: DEMO_PASSWORDS.manager,
      });
      expect(body.code).toBe('account_suspended');
    });

    it('requires a token and the right role', async () => {
      expect((await call('GET', '/admin/overview')).status).toBe(401);
      expect((await call('GET', '/admin/overview', undefined, await manager())).status).toBe(403);
      expect((await call('GET', '/business', undefined, await admin())).status).toBe(403);
    });
  });

  describe('admin', () => {
    it('suspending a business ends its managers sessions, reactivating restores them', async () => {
      const managerToken = await manager();
      const adminToken = await admin();
      await call('PUT', '/admin/businesses/b-life/status', { status: 'suspended' }, adminToken);
      const blocked = await call('GET', '/business', undefined, managerToken);
      expect(blocked.status).toBe(401);
      expect(blocked.body.code).toBe('business_suspended');

      await call('PUT', '/admin/businesses/b-life/status', { status: 'active' }, adminToken);
      expect((await call('GET', '/business', undefined, managerToken)).status).toBe(200);
    });

    it('creates a business and a manager who can sign in', async () => {
      const token = await admin();
      const business = await call('POST', '/admin/businesses', { name: 'Bar Sport', category: 'cafe' }, token);
      expect(business.status).toBe(201);
      const id = business.body['id'] as string;

      const created = await call(
        'POST',
        '/admin/managers',
        { email: 'nuovo@example.com', firstName: 'Nuovo', lastName: 'Gestore', businessId: id, temporaryPassword: 'temporanea1' },
        token,
      );
      expect(created.status).toBe(201);
      expect(await login('nuovo@example.com', 'temporanea1')).toBeTruthy();
    });

    it('refuses a manager email already in use', async () => {
      const { status, body } = await call(
        'POST',
        '/admin/managers',
        { email: DEMO_ACCOUNTS.manager, firstName: 'A', lastName: 'B', businessId: 'b-life', temporaryPassword: 'temporanea1' },
        await admin(),
      );
      expect(status).toBe(409);
      expect(body.code).toBe('email_taken');
    });

    it('filters businesses by status and pages the result', async () => {
      const { body } = await call('GET', '/admin/businesses', undefined, await admin(), { status: 'suspended' });
      expect(body['total']).toBe(1);
      expect((body['items'] as { name: string }[])[0].name).toBe('Studio Loto');
    });
  });

  describe('cards', () => {
    async function issue(token: string, templateId: string, extra: object = {}) {
      const customer = await call('POST', '/business/customers', { firstName: 'Test', lastName: 'Cliente' }, token);
      return call('POST', '/business/cards', { customerId: customer.body['id'], templateId, ...extra }, token);
    }

    it('issues an entries card with its payment and carried-over stamps', async () => {
      const token = await manager();
      const { status, body } = await issue(token, 't-life-12', {
        stampsAlreadyUsed: 3,
        payment: { amountCents: 9000, method: 'cash' },
      });
      expect(status).toBe(201);
      expect(body['stamps']).toHaveLength(3);
      expect(body['paidCents']).toBe(9000);
      expect(body['validUntil']).toBe('2027-09-30');
      expect(body['status']).toBe('active');
    });

    it('keeps card numbers unique within the business', async () => {
      const token = await manager();
      const { status, body } = await issue(token, 't-life-12', { number: '0001' });
      expect(status).toBe(409);
      expect(body.code).toBe('card_number_taken');
    });

    it('records a monthly fee once per month, with its payment', async () => {
      const token = await manager();
      const card = (await issue(token, 't-life-month')).body;
      const path = `/business/cards/${card['id']}/stamps`;

      expect((await call('POST', path, {}, token)).body.code).toBe('validation_error');

      const paid = await call('POST', path, { period: '2026-09-15', payment: { amountCents: 5500, method: 'card' } }, token);
      expect(paid.status).toBe(201);
      expect(paid.body['stamps']).toEqual([
        expect.objectContaining({ period: '2026-09-01', amountCents: 5500, operatorInitials: 'Lb' }),
      ]);
      expect(paid.body['paidCents']).toBe(5500);

      expect((await call('POST', path, { period: '2026-09-01' }, token)).body.code).toBe('period_already_paid');
    });

    it('undoing a stamp removes the payment recorded with it', async () => {
      const token = await manager();
      const card = (await issue(token, 't-life-month')).body;
      const stamped = await call(
        'POST',
        `/business/cards/${card['id']}/stamps`,
        { period: '2026-09-01', payment: { amountCents: 5500, method: 'cash' } },
        token,
      );
      const stampId = (stamped.body['stamps'] as { id: string }[])[0].id;
      const undone = await call('DELETE', `/business/cards/${card['id']}/stamps/${stampId}`, undefined, token);
      expect(undone.body['stamps']).toHaveLength(0);
      expect(undone.body['payments']).toHaveLength(0);
    });

    it('completes an entries card when full and refuses more stamps', async () => {
      const token = await manager();
      const card = (await issue(token, 't-life-12', { stampsAlreadyUsed: 11 })).body;
      const last = await call('POST', `/business/cards/${card['id']}/stamps`, {}, token);
      expect(last.body['status']).toBe('completed');
      const extra = await call('POST', `/business/cards/${card['id']}/stamps`, {}, token);
      expect(extra.body.code).toBe('card_not_active');
    });

    it('makes a full loyalty card redeemable and renews it', async () => {
      const token = await login('gino.esposito@example.com', DEMO_PASSWORDS.manager);
      const cards = await call('GET', '/business/cards', undefined, token, { group: 'loyalty' });
      const full = (cards.body['items'] as { id: string; rewardReady: boolean }[]).find((c) => c.rewardReady);
      expect(full).toBeDefined();

      const { status, body } = await call('POST', `/business/cards/${full!.id}/redeem`, { renew: true }, token);
      expect(status).toBe(200);
      expect(body['card']).toMatchObject({ status: 'completed', rewardReady: false });
      expect(body['renewed']).toMatchObject({ status: 'active', stamps: [] });

      const again = await call('POST', `/business/cards/${full!.id}/redeem`, {}, token);
      expect(again.body.code).toBe('reward_not_ready');
    });

    it('lists what needs attention, reward first', async () => {
      const token = await manager();
      const { body } = await call('GET', '/business/overview', undefined, token);
      const reasons = (body['attention'] as { reason: string }[]).map((a) => a.reason);
      expect(reasons).toEqual(expect.arrayContaining(['month_unpaid', 'expiring_soon', 'balance_due']));
    });

    it('never shows another business the cards of this one', async () => {
      const token = await login('gino.esposito@example.com', DEMO_PASSWORDS.manager);
      expect((await call('GET', '/business/cards/k-1', undefined, token)).status).toBe(404);
    });
  });

  describe('customers', () => {
    it('refuses to delete a customer with active cards', async () => {
      const token = await manager();
      const { status, body } = await call('DELETE', '/business/customers/c-life-0', undefined, token);
      expect(status).toBe(409);
      expect(body.code).toBe('customer_has_active_cards');
    });

    it('finds customers by card number', async () => {
      const token = await manager();
      const { body } = await call('GET', '/business/customers', undefined, token, { q: '0005' });
      expect(body['total']).toBe(1);
    });
  });

  it('persists changes across instances', async () => {
    const token = await manager();
    await call('POST', '/business/customers', { firstName: 'Persistente', lastName: 'Rossi' }, token);
    backend = new MockBackend(() => NOW);
    const { body } = await call('GET', '/business/customers', undefined, token, { q: 'Persistente' });
    expect(body['total']).toBe(1);
  });
});
