import { renderPage } from '@testing/render-page';

import ManagersPage from './managers-page';

describe('ManagersPage', () => {
  it('lists managers with their business, filtered by business when asked', async () => {
    const { text } = await renderPage(ManagersPage, { as: 'admin', inputs: { businessId: 'b-life' } });
    expect(text()).toContain('Bianchi');
    expect(text()).toContain('Vitale');
    expect(text()).not.toContain('Esposito');
  });
});
