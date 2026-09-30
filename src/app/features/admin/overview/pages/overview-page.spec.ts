import { renderPage } from '@testing/render-page';

import OverviewPage from './overview-page';

describe('OverviewPage', () => {
  it('shows the platform totals and the latest businesses', async () => {
    const { text } = await renderPage(OverviewPage, { as: 'admin' });
    expect(text()).toContain('overview.activeCards');
    expect(text()).toContain('Studio Loto');
  });
});
