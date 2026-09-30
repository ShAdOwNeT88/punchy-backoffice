import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

export default [
  {
    path: '',
    pathMatch: 'full',
    providers: [provideTranslocoScope('dashboard')],
    loadComponent: () => import('./pages/dashboard-page'),
  },
] satisfies Routes;
