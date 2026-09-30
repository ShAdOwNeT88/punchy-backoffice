import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  type ApplicationConfig,
  type Provider,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MAT_ICON_DEFAULT_OPTIONS } from '@angular/material/icon';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { authInterceptor } from '@core/auth/auth.interceptor';
import { DEMO_MODE } from '@core/demo/demo-mode';
import { provideI18n } from '@core/i18n/i18n';
import { environment } from '@env/environment';
import { mockBackendInterceptor, resetMockData } from '@mocks/mock-backend.interceptor';
import { DEMO_ACCOUNTS, DEMO_PASSWORDS } from '@mocks/seed';

import { routes } from './app.routes';

/** Until the backend exists every API call is answered in the browser (docs/DECISIONS.md). */
const mock = environment.useMockApi;

const demoProviders: Provider[] = mock
  ? [
      {
        provide: DEMO_MODE,
        useValue: {
          accounts: [
            { role: 'admin', email: DEMO_ACCOUNTS.admin, password: DEMO_PASSWORDS.admin },
            { role: 'manager', email: DEMO_ACCOUNTS.manager, password: DEMO_PASSWORDS.manager },
          ],
          reset: resetMockData,
        },
      },
    ]
  : [];

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
    provideHttpClient(
      withInterceptors(mock ? [authInterceptor, mockBackendInterceptor] : [authInterceptor]),
    ),
    provideI18n(),
    { provide: MAT_ICON_DEFAULT_OPTIONS, useValue: { fontSet: 'material-symbols-outlined' } },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } },
    ...demoProviders,
  ],
};
