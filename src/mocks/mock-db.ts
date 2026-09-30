import type {
  AccountStatus,
  Appearance,
  CardProgram,
  IssuerCategory,
  PaymentMethod,
} from '@features/manager/data-access/api/model';

import { buildSeed } from './seed';

/**
 * Records as the mock backend stores them. They carry what a database would (passwords, foreign
 * keys); `views.ts` turns them into the API shapes of `openapi/punchy.yaml`.
 */
export interface UserRecord {
  id: string;
  role: 'admin' | 'manager';
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  initials?: string;
  phone?: string;
  businessId?: string;
  status: AccountStatus;
  createdAt: string;
  lastLoginAt?: string;
}

export interface BusinessRecord {
  id: string;
  name: string;
  category: IssuerCategory;
  tagline?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  address?: string;
  city?: string;
  vatNumber?: string;
  logoUrl?: string;
  appearance: Appearance;
  status: AccountStatus;
  createdAt: string;
  nextCardNumber: number;
}

export interface TemplateRecord {
  id: string;
  businessId: string;
  name: string;
  program: CardProgram;
  totalSlots: number;
  priceCents?: number;
  reward?: string;
  validityDays?: number;
  printHolder: boolean;
  archived: boolean;
}

export interface CustomerRecord {
  id: string;
  businessId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  notes?: string;
  createdAt: string;
}

export interface StampRecord {
  id: string;
  date: string;
  period?: string;
  amountCents?: number;
  operatorInitials?: string;
  operatorName?: string;
  paymentId?: string;
  note?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amountCents: number;
  method: PaymentMethod;
  period?: string;
  operatorName?: string;
  note?: string;
}

export interface CardRecord {
  id: string;
  businessId: string;
  customerId: string;
  templateId: string;
  number: string;
  program: CardProgram;
  totalSlots: number;
  priceCents?: number;
  reward?: string;
  printHolder: boolean;
  validUntil?: string;
  issuedAt: string;
  cancelledAt?: string;
  redeemedAt?: string;
  stamps: StampRecord[];
  payments: PaymentRecord[];
}

export interface MockDb {
  version: number;
  users: UserRecord[];
  businesses: BusinessRecord[];
  templates: TemplateRecord[];
  customers: CustomerRecord[];
  cards: CardRecord[];
}

export const MOCK_DB_VERSION = 1;
const STORAGE_KEY = 'punchy.mock-db';

/** Reads the database from localStorage, seeding it on first use or after a schema change. */
export function loadDb(today: Date): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw) as MockDb;
      if (db.version === MOCK_DB_VERSION) return db;
    }
  } catch {
    // Unreadable storage: fall back to a fresh seed.
  }
  return buildSeed(today);
}

export function saveDb(db: MockDb): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Private mode or quota: the data lives until the page reloads.
  }
}

export function clearDb(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

let sequence = 0;

/** A new id with a readable prefix, unique within the page's lifetime. */
export function newId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now().toString(36)}${sequence.toString(36)}`;
}
