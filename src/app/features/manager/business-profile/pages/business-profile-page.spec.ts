import { renderPage } from '@testing/render-page';

import BusinessProfilePage from './business-profile-page';

describe('BusinessProfilePage', () => {
  it('fills the form from the business and previews the card', async () => {
    const { element, fixture } = await renderPage(BusinessProfilePage, { as: 'manager' });
    await fixture.whenStable();
    expect(element.querySelector('h1')?.textContent).toContain('Life');
    const tagline = element.querySelector('input[formcontrolname=tagline]') as HTMLInputElement;
    expect(tagline.value).toBe('swimming');
    expect(element.querySelector('app-card-preview')).not.toBeNull();
  });
});
