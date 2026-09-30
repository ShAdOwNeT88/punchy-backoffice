import { renderPage } from '@testing/render-page';

import CardDetailPage from './card-detail-page';

describe('CardDetailPage', () => {
  it('shows the card, the stamp action and the history', async () => {
    const { element, text } = await renderPage(CardDetailPage, { as: 'manager', inputs: { cardId: 'k-5' } });
    expect(element.querySelector('h1')?.textContent).toContain('Abbonamento mensile corso nuoto');
    expect(text()).toContain('customers.stamp.action.monthly');
    expect(element.querySelectorAll('.history tr.mat-mdc-row').length).toBeGreaterThan(0);
  });
});
