import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

export default [
  {
    path: '',
    providers: [provideTranslocoScope('templates')],
    loadComponent: () => import('./pages/templates-page'),
  },
] satisfies Routes;
