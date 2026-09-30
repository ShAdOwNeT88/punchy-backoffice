import { renderPage } from '@testing/render-page';

import LoginPage from './login-page';

describe('LoginPage', () => {
  async function submit(email: string, password: string) {
    const page = await renderPage(LoginPage, { as: null });
    const form = page.element.querySelector('form') as HTMLFormElement;
    for (const [name, value] of [
      ['email', email],
      ['password', password],
    ]) {
      const input = form.querySelector(`input[formcontrolname=${name}]`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    }
    form.dispatchEvent(new Event('submit'));
    await page.fixture.whenStable();
    return page;
  }

  it('validates email and password length before calling the API', async () => {
    const { text } = await submit('not-an-email', 'short');
    expect(text()).toContain('validation.email');
    expect(text()).toContain('validation.minLength');
  });

  it('explains wrong credentials', async () => {
    const { text } = await submit('admin@example.com', 'wrong-password');
    expect(text()).toContain('errors.invalid_credentials');
  });
});
