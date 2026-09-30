import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

export default [
  {
    path: '',
    pathMatch: 'full',
    providers: [provideTranslocoScope('overview')],
    loadComponent: () => import('./pages/overview-page'),
  },
] satisfies Routes;
