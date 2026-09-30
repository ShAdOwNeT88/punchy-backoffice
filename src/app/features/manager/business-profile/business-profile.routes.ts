import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

export default [
  {
    path: '',
    providers: [provideTranslocoScope('business')],
    loadComponent: () => import('./pages/business-profile-page'),
  },
] satisfies Routes;
