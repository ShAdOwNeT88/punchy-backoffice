import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Injectable, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { type TranslocoLoader, provideTransloco } from '@jsverse/transloco';
import { firstValueFrom, of } from 'rxjs';

import { AuthService } from '@core/auth/api/endpoints/auth/auth.service';
import { authInterceptor } from '@core/auth/auth.interceptor';
import { Session } from '@core/auth/session';
import { mockBackendInterceptor, resetMockData } from '@mocks/mock-backend.interceptor';
import { DEMO_ACCOUNTS, DEMO_PASSWORDS } from '@mocks/seed';

/** Translations are not loaded in tests: every key renders as itself, which tests can assert. */
@Injectable({ providedIn: 'root' })
class KeysLoader implements TranslocoLoader {
  getTranslation() {
    return of({});
  }
}

/**
 * Renders a routed page against the mock backend with fresh demo data, signed in as the given
 * role, and waits until its requests have settled.
 */
export async function renderPage<T>(
  page: Type<T>,
  options: { as: 'admin' | 'manager' | null; inputs?: Record<string, unknown> },
) {
  localStorage.clear();
  resetMockData();
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideHttpClient(withInterceptors([authInterceptor, mockBackendInterceptor])),
      provideTransloco({
        config: {
          availableLangs: ['it'],
          defaultLang: 'it',
          missingHandler: { logMissingKey: false },
        },
        loader: KeysLoader,
      }),
    ],
  });
  if (options.as) {
    const { token, user } = await firstValueFrom(
      TestBed.inject(AuthService).login({
        email: DEMO_ACCOUNTS[options.as],
        password: DEMO_PASSWORDS[options.as],
      }),
    );
    TestBed.inject(Session).start(token, user);
  }
  const fixture = TestBed.createComponent(page);
  for (const [name, value] of Object.entries(options.inputs ?? {})) {
    fixture.componentRef.setInput(name, value);
  }
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  return { fixture, element, text: () => element.textContent ?? '' };
}
