import { renderPage } from '@testing/render-page';

import DashboardPage from './dashboard-page';

describe('DashboardPage', () => {
  it('shows the day and the cards that need attention', async () => {
    const { text } = await renderPage(DashboardPage, { as: 'manager' });
    expect(text()).toContain('dashboard.reason.month_unpaid');
    expect(text()).toContain('dashboard.reason.balance_due');
  });
});
