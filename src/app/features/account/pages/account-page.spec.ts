import { renderPage } from '@testing/render-page';

import AccountPage from './account-page';

describe('AccountPage', () => {
  it('shows the signed-in user and refuses mismatching passwords', async () => {
    const { fixture, element } = await renderPage(AccountPage, { as: 'manager' });
    const firstName = element.querySelector('input[formcontrolname=firstName]') as HTMLInputElement;
    expect(firstName.value).toBe('Luigi');

    const password = element.querySelectorAll('form')[1];
    const set = (name: string, value: string) => {
      const input = password.querySelector(`input[formcontrolname=${name}]`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    set('currentPassword', 'punchy-demo');
    set('newPassword', 'nuova-password');
    set('confirmPassword', 'altra-password');
    password.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(password.textContent).toContain('validation.mismatch');
  });
});
