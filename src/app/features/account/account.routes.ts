import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

export default [
  {
    path: '',
    providers: [provideTranslocoScope('account')],
    loadComponent: () => import('./pages/account-page'),
  },
] satisfies Routes;
