import type { PaymentMethod } from '@features/manager/data-access/api/model';

import { addDays, addMonths, isoDate, monthStart } from './dates';
import type {
  BusinessRecord,
  CardRecord,
  CustomerRecord,
  MockDb,
  StampRecord,
  TemplateRecord,
  UserRecord,
} from './mock-db';

/**
 * Demo accounts of the mock backend. Every password is `punchy-demo`; the admin's is
 * `punchy-admin`. `chiara.ferri@example.com` belongs to a suspended business and cannot sign in.
 */
export const DEMO_ACCOUNTS = {
  admin: 'admin@example.com',
  manager: 'luigi.bianchi@example.com',
} as const;

export const DEMO_PASSWORDS = { admin: 'punchy-admin', manager: 'punchy-demo' } as const;
const DEMO_PASSWORD = DEMO_PASSWORDS.manager;
const ADMIN_PASSWORD = DEMO_PASSWORDS.admin;

const FIRST_NAMES = [
  'Mario', 'Giulia', 'Luca', 'Francesca', 'Marco', 'Chiara', 'Andrea', 'Sara', 'Alessandro',
  'Martina', 'Davide', 'Elena', 'Simone', 'Valentina', 'Matteo', 'Anna', 'Paolo', 'Federica',
];
const LAST_NAMES = [
  'Rossi', 'Esposito', 'Russo', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno',
  'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti',
];

/** Builds a demo database whose dates are relative to `now`, so the data never goes stale. */
export function buildSeed(now: Date): MockDb {
  const today = isoDate(now);
  const at = (day: string) => `${day}T09:00:00.000Z`;

  const businesses: BusinessRecord[] = [
    {
      id: 'b-life', name: 'Life', category: 'pool', tagline: 'swimming', contactName: 'Luigi',
      contactPhone: '345 000 0000', email: 'info@example.com', address: 'Via del Mare 12',
      city: 'Salerno', vatNumber: '01234560658',
      appearance: { style: 'ocean', design: 'paper', stampStyle: 'signature', emblem: 'leaf' },
      status: 'active', createdAt: at(addDays(today, -210)), nextCardNumber: 1,
    },
    {
      id: 'b-iron', name: 'Iron District', category: 'gym', tagline: 'fitness club',
      contactName: 'Reception', contactPhone: '081 000 0000', city: 'Napoli',
      vatNumber: '09876540635',
      appearance: { style: 'ember', design: 'gradient', stampStyle: 'round', emblem: 'bolt' },
      status: 'active', createdAt: at(addDays(today, -150)), nextCardNumber: 1180,
    },
    {
      id: 'b-cafe', name: 'Caffè Centrale', category: 'cafe', tagline: 'torrefazione dal 1962',
      contactName: 'Luigi', contactPhone: '089 111 1111', city: 'Salerno',
      appearance: { style: 'coffee', design: 'gradient', stampStyle: 'round' },
      status: 'active', createdAt: at(addDays(today, -90)), nextCardNumber: 1,
    },
    {
      id: 'b-aurora', name: 'Salone Aurora', category: 'beauty', tagline: 'hair & beauty',
      contactPhone: '089 000 0000', city: 'Cava de\' Tirreni',
      appearance: { style: 'rose', design: 'gradient', stampStyle: 'signature', emblem: 'heart' },
      status: 'active', createdAt: at(addDays(today, -60)), nextCardNumber: 200,
    },
    {
      id: 'b-loto', name: 'Studio Loto', category: 'studio', tagline: 'yoga & pilates',
      contactName: 'Chiara', contactPhone: '333 000 0000', city: 'Avellino',
      appearance: { style: 'violet', design: 'gradient', stampStyle: 'round', emblem: 'star' },
      status: 'suspended', createdAt: at(addDays(today, -40)), nextCardNumber: 60,
    },
  ];

  const users: UserRecord[] = [
    {
      id: 'u-admin', role: 'admin', email: DEMO_ACCOUNTS.admin, password: ADMIN_PASSWORD,
      firstName: 'Antonio', lastName: 'Admin', initials: 'AA', status: 'active',
      createdAt: at(addDays(today, -240)),
    },
    manager('u-luigi', 'b-life', 'Luigi', 'Bianchi', 'Lb', DEMO_ACCOUNTS.manager),
    manager('u-sara', 'b-life', 'Sara', 'Vitale', 'SV', 'sara.vitale@example.com'),
    manager('u-alex', 'b-iron', 'Alessio', 'Russo', 'AR', 'alessio.russo@example.com'),
    manager('u-gino', 'b-cafe', 'Gino', 'Esposito', 'GE', 'gino.esposito@example.com'),
    manager('u-anna', 'b-aurora', 'Anna', 'Bellini', 'AB', 'anna.bellini@example.com'),
    {
      ...manager('u-mv', 'b-aurora', 'Monica', 'Vairo', 'MV', 'monica.vairo@example.com'),
      status: 'suspended',
    },
    manager('u-chiara', 'b-loto', 'Chiara', 'Ferri', 'CF', 'chiara.ferri@example.com'),
  ];

  function manager(
    id: string, businessId: string, firstName: string, lastName: string, initials: string,
    email: string,
  ): UserRecord {
    return {
      id, role: 'manager', email, password: DEMO_PASSWORD, firstName, lastName, initials,
      businessId, status: 'active', createdAt: at(addDays(today, -100)),
      lastLoginAt: at(addDays(today, -1)),
    };
  }

  const templates: TemplateRecord[] = [
    tpl('t-life-12', 'b-life', '12 ingressi nuoto libero', 'entries', 12, 9000, 365),
    tpl('t-life-month', 'b-life', 'Abbonamento mensile corso nuoto', 'monthly', 12, 5500),
    tpl('t-iron-month', 'b-iron', 'Abbonamento sala pesi', 'monthly', 12, 4500),
    tpl('t-iron-10', 'b-iron', '10 ingressi open', 'entries', 10, 8000, 180),
    { ...tpl('t-cafe', 'b-cafe', 'Fidelity caffè', 'loyalty', 10), reward: 'Un caffè omaggio', printHolder: false },
    { ...tpl('t-aurora', 'b-aurora', 'Fidelity piega', 'loyalty', 6), reward: 'Piega gratuita' },
    tpl('t-loto', 'b-loto', '10 lezioni yoga', 'entries', 10, 12000, 120),
  ];

  function tpl(
    id: string, businessId: string, name: string, program: TemplateRecord['program'],
    totalSlots: number, priceCents?: number, validityDays?: number,
  ): TemplateRecord {
    return {
      id, businessId, name, program, totalSlots, priceCents, validityDays,
      printHolder: program !== 'loyalty', archived: false,
    };
  }

  const customers: CustomerRecord[] = [];
  const cards: CardRecord[] = [];
  let personIndex = 0;

  function customer(businessId: string, withEmail = true): CustomerRecord {
    const i = personIndex++;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const record: CustomerRecord = {
      id: `c-${businessId.slice(2)}-${i}`, businessId, firstName, lastName,
      email: withEmail
        ? `${firstName}.${lastName}`.toLowerCase().replace(/[^a-z.]/g, '') + `${i}@example.com`
        : undefined,
      phone: `333 ${String(1000000 + i * 7919).slice(0, 7)}`,
      createdAt: at(addDays(today, -120 + i)),
    };
    customers.push(record);
    return record;
  }

  function card(
    c: CustomerRecord, t: TemplateRecord, stamps: StampRecord[], opts: Partial<CardRecord> = {},
  ): CardRecord {
    const business = businesses.find((b) => b.id === t.businessId)!;
    const issuedAt = opts.issuedAt ?? at(stamps[0]?.date ?? addDays(today, -30));
    const record: CardRecord = {
      id: `k-${cards.length + 1}`, businessId: t.businessId, customerId: c.id, templateId: t.id,
      number: String(business.nextCardNumber++).padStart(4, '0'), program: t.program,
      totalSlots: t.totalSlots, priceCents: t.priceCents, reward: t.reward,
      printHolder: t.printHolder,
      validUntil: t.validityDays ? addDays(issuedAt.slice(0, 10), t.validityDays) : undefined,
      issuedAt, stamps, payments: [], ...opts,
    };
    cards.push(record);
    return record;
  }

  let stampSeq = 0;
  const stamp = (date: string, initials?: string, extra: Partial<StampRecord> = {}): StampRecord => ({
    id: `s-${++stampSeq}`, date, operatorInitials: initials, ...extra,
  });
  const entries = (count: number, from: number, every: number, initials: string[]) =>
    Array.from({ length: count }, (_, i) =>
      stamp(addDays(today, from + i * every), initials[i % initials.length]));

  /** Monthly stamps with their payments, for the `count` months ending `endOffset` months from now. */
  function monthly(record: CardRecord, count: number, endOffset: number, amount: number, initials: string[]) {
    for (let i = 0; i < count; i++) {
      const period = addMonths(monthStart(today), endOffset - (count - 1 - i));
      const date = addDays(period, 3);
      const paymentId = `p-${record.id}-${i}`;
      const method: PaymentMethod = i % 3 === 0 ? 'card' : 'cash';
      record.payments.push({ id: paymentId, date, amountCents: amount, method, period });
      record.stamps.push(stamp(date, initials[i % initials.length], { period, amountCents: amount, paymentId }));
    }
  }

  // Life (pool): the paper card of the first customer, and the attention cases.
  const tLife = templates[0];
  const tLifeMonth = templates[1];
  const mario = customer('b-life');
  const k1 = card(mario, tLife, entries(1, -1, 1, ['Lb']), { validUntil: addDays(today, 270) });
  k1.payments.push({ id: 'p-k1', date: addDays(today, -1), amountCents: 9000, method: 'cash' });
  const k2 = card(customer('b-life'), tLife, entries(10, -60, 5, ['Lb', 'SV']));
  k2.payments.push({ id: 'p-k2', date: k2.stamps[0].date, amountCents: 9000, method: 'card' });
  const k3 = card(customer('b-life'), tLife, entries(4, -20, 4, ['SV']));
  k3.payments.push({ id: 'p-k3', date: k3.stamps[0].date, amountCents: 5000, method: 'cash', note: 'Acconto' });
  const k4 = card(customer('b-life'), tLife, entries(3, -340, 30, ['Lb']), { validUntil: addDays(today, 9) });
  k4.payments.push({ id: 'p-k4', date: k4.stamps[0].date, amountCents: 9000, method: 'transfer' });
  const k5 = card(customer('b-life'), tLifeMonth, [], { issuedAt: at(addMonths(monthStart(today), -5)) });
  monthly(k5, 5, -1, 5500, ['SV', 'Lb']);
  const k6 = card(customer('b-life'), tLifeMonth, [], { issuedAt: at(addMonths(monthStart(today), -3)) });
  monthly(k6, 4, 0, 5500, ['Lb']);
  const k7 = card(customer('b-life'), tLife, entries(12, -200, 12, ['Lb', 'SV']));
  k7.payments.push({ id: 'p-k7', date: k7.stamps[0].date, amountCents: 9000, method: 'cash' });
  card(customer('b-life'), tLife, entries(2, -15, 7, ['SV']), { cancelledAt: at(addDays(today, -5)) });
  for (let i = 0; i < 6; i++) {
    const k = card(customer('b-life'), tLife, entries(1 + (i % 5), -40 + i * 3, 4, ['Lb', 'SV']));
    k.payments.push({ id: `p-kx${i}`, date: k.stamps[0].date, amountCents: 9000, method: 'cash' });
  }
  customer('b-life');
  // Mario also has a gym subscription, like in the app's demo data.
  const tIron = templates[2];
  const marioGym = customer('b-iron');
  Object.assign(marioGym, { firstName: mario.firstName, lastName: mario.lastName, email: mario.email });
  const g1 = card(marioGym, tIron, [], { issuedAt: at(addMonths(monthStart(today), -8)), validUntil: addDays(today, 90) });
  monthly(g1, 8, 0, 4500, ['SV', 'AR']);
  for (let i = 0; i < 5; i++) {
    const k = card(customer('b-iron'), tIron, [], { issuedAt: at(addMonths(monthStart(today), -3)) });
    monthly(k, 2 + (i % 3), i % 2 === 0 ? 0 : -1, 4500, ['AR']);
  }
  const tIron10 = templates[3];
  const g2 = card(customer('b-iron'), tIron10, entries(8, -50, 5, ['AR']));
  g2.payments.push({ id: 'p-g2', date: g2.stamps[0].date, amountCents: 8000, method: 'card' });

  // Caffè Centrale (loyalty, anonymous on the card).
  const tCafe = templates[4];
  card(customer('b-cafe'), tCafe, entries(7, -16, 2, ['GE']));
  card(customer('b-cafe'), tCafe, entries(10, -25, 2, ['GE']));
  for (let i = 0; i < 4; i++) card(customer('b-cafe', i % 2 === 0), tCafe, entries(2 + i, -10, 2, ['GE']));

  // Salone Aurora.
  const tAurora = templates[5];
  card(customer('b-aurora'), tAurora, entries(6, -170, 28, ['AB', 'AB', 'MV']));
  card(customer('b-aurora'), tAurora, entries(3, -80, 25, ['AB']));

  // Studio Loto (suspended).
  const tLoto = templates[6];
  card(customer('b-loto'), tLoto, entries(2, -20, 7, ['CF']));

  return { version: 1, users, businesses, templates, customers, cards };
}
