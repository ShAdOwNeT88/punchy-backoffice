import { renderPage } from '@testing/render-page';

import TemplatesPage from './templates-page';

describe('TemplatesPage', () => {
  it('lists the active templates', async () => {
    const { text } = await renderPage(TemplatesPage, { as: 'manager' });
    expect(text()).toContain('12 ingressi nuoto libero');
    expect(text()).toContain('Abbonamento mensile corso nuoto');
  });
});
