import { renderPage } from '@testing/render-page';

import BusinessesPage from './businesses-page';

describe('BusinessesPage', () => {
  it('lists every business with its status', async () => {
    const { element } = await renderPage(BusinessesPage, { as: 'admin' });
    expect(element.querySelectorAll('tr.clickable-row')).toHaveLength(5);
    expect(element.textContent).toContain('accountStatus.suspended');
  });
});
