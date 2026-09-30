import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

export default [
  {
    path: '',
    providers: [provideTranslocoScope('login')],
    loadComponent: () => import('./pages/login-page'),
  },
] satisfies Routes;
