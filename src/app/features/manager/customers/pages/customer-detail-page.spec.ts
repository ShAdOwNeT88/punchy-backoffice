import { renderPage } from '@testing/render-page';

import CustomerDetailPage from './customer-detail-page';

describe('CustomerDetailPage', () => {
  it('shows the customer and their cards', async () => {
    const { element } = await renderPage(CustomerDetailPage, {
      as: 'manager',
      inputs: { customerId: 'c-life-0' },
    });
    expect(element.querySelector('h1')?.textContent).toContain('Mario Rossi');
    expect(element.querySelectorAll('app-card-row')).toHaveLength(1);
  });
});
