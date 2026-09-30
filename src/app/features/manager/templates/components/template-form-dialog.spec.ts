import { of } from 'rxjs';

import { renderDialog } from '@testing/dialog-harness';

import { BusinessService } from '../../data-access/api/endpoints/business/business.service';
import type { CardTemplate } from '../../data-access/api/model';
import { TemplateFormDialog } from './template-form-dialog';

describe('TemplateFormDialog', () => {
  it('creates an entries package with its price in cents', async () => {
    const createTemplate = vi.fn().mockReturnValue(of({}));
    const dialog = await renderDialog(TemplateFormDialog, null, [
      { provide: BusinessService, useValue: { createTemplate } },
    ]);
    await dialog.type('name', '10 ingressi');
    await dialog.type('price', '80');
    await dialog.submit();
    expect(createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ name: '10 ingressi', program: 'entries', totalSlots: 10, priceCents: 8000, printHolder: true }),
    );
  });

  it('requires the reward of a loyalty card and drops the price', async () => {
    const createTemplate = vi.fn().mockReturnValue(of({}));
    const dialog = await renderDialog(TemplateFormDialog, null, [
      { provide: BusinessService, useValue: { createTemplate } },
    ]);
    const form = (dialog.fixture.componentInstance as unknown as { form: { controls: { program: { setValue(v: string): void } } } }).form;
    form.controls.program.setValue('loyalty');
    await dialog.type('name', 'Fidelity');
    await dialog.submit();
    expect(createTemplate).not.toHaveBeenCalled();

    await dialog.type('reward', 'Un caffè omaggio');
    await dialog.submit();
    expect(createTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ program: 'loyalty', reward: 'Un caffè omaggio', priceCents: undefined, printHolder: false }),
    );
  });

  it('edits without changing the program', async () => {
    const updateTemplate = vi.fn().mockReturnValue(of({}));
    const template: CardTemplate = {
      id: 't1', name: 'Mensile', program: 'monthly', totalSlots: 12, priceCents: 4500,
      printHolder: true, archived: false, activeCardCount: 3,
    };
    const dialog = await renderDialog(TemplateFormDialog, template, [
      { provide: BusinessService, useValue: { updateTemplate } },
    ]);
    await dialog.submit();
    expect(updateTemplate).toHaveBeenCalledWith('t1', expect.not.objectContaining({ program: expect.anything() }));
    expect(updateTemplate.mock.calls[0][1]).toMatchObject({ priceCents: 4500, totalSlots: 12 });
  });
});
