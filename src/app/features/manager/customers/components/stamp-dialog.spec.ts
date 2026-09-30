import { of } from 'rxjs';

import { renderDialog } from '@testing/dialog-harness';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { Card } from '../../data-access/api/model';
import { StampDialog } from './stamp-dialog';

function card(overrides: Partial<Card>): Card {
  return {
    id: 'k-1',
    number: '0001',
    templateId: 't',
    templateName: 'T',
    program: 'entries',
    totalSlots: 12,
    priceCents: 5500,
    printHolder: true,
    customer: { id: 'c', firstName: 'Mario', lastName: 'Rossi' },
    status: 'active',
    rewardReady: false,
    issuedAt: '2026-01-01T00:00:00Z',
    stamps: [],
    payments: [],
    paidCents: 0,
    ...overrides,
  };
}

describe('StampDialog', () => {
  it('stamps an entries card without a payment', async () => {
    const addStamp = vi.fn().mockReturnValue(of(card({})));
    const dialog = await renderDialog(StampDialog, card({}), [
      { provide: BusinessService, useValue: { addStamp } },
    ]);
    expect(dialog.input('period')).toBeNull();
    await dialog.submit();
    expect(addStamp).toHaveBeenCalledWith('k-1', expect.objectContaining({ period: undefined, payment: undefined }));
    expect(dialog.close).toHaveBeenCalled();
  });

  it('records a month with its payment, defaulting to the monthly fee', async () => {
    const addStamp = vi.fn().mockReturnValue(of(card({})));
    const dialog = await renderDialog(StampDialog, card({ program: 'monthly' }), [
      { provide: BusinessService, useValue: { addStamp } },
    ]);
    await dialog.submit();
    const [, input] = addStamp.mock.calls[0];
    expect(input.period).toMatch(/^\d{4}-\d{2}-01$/);
    expect(input.payment).toMatchObject({ amountCents: 5500, method: 'cash' });
  });

  it('refuses a month paid with no amount', async () => {
    const addStamp = vi.fn();
    const dialog = await renderDialog(StampDialog, card({ program: 'monthly', priceCents: undefined }), [
      { provide: BusinessService, useValue: { addStamp } },
    ]);
    await dialog.submit();
    expect(addStamp).not.toHaveBeenCalled();
  });
});
