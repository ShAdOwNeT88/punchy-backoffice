import { renderPage } from '@testing/render-page';

import CustomersPage from './customers-page';

describe('CustomersPage', () => {
  it('lists the customers of the business only', async () => {
    const { element } = await renderPage(CustomersPage, { as: 'manager' });
    expect(element.querySelectorAll('tr.clickable-row')).toHaveLength(15);
  });
});
