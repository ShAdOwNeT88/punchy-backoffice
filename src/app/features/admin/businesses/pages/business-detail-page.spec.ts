import { renderPage } from '@testing/render-page';

import BusinessDetailPage from './business-detail-page';

describe('BusinessDetailPage', () => {
  it('shows the business, its card and its managers', async () => {
    const { element, text } = await renderPage(BusinessDetailPage, {
      as: 'admin',
      inputs: { businessId: 'b-life' },
    });
    expect(element.querySelector('h1')?.textContent).toContain('Life');
    expect(element.querySelector('app-card-preview')).not.toBeNull();
    expect(text()).toContain('luigi.bianchi@example.com');
  });
});
