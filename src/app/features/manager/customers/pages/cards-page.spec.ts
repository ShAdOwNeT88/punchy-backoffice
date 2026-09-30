import { renderPage } from '@testing/render-page';

import CardsPage from './cards-page';

describe('CardsPage', () => {
  it('shows the active cards by default', async () => {
    const { element } = await renderPage(CardsPage, { as: 'manager' });
    expect(element.querySelectorAll('app-card-row')).toHaveLength(12);
  });
});
