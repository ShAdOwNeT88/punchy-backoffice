import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { provideTranslatedPaginator } from '@core/i18n/paginator-intl';

export default [
  {
    path: '',
    providers: [provideTranslocoScope('businesses'), provideTranslatedPaginator()],
    children: [
      { path: '', loadComponent: () => import('./pages/businesses-page') },
      { path: ':businessId', loadComponent: () => import('./pages/business-detail-page') },
    ],
  },
] satisfies Routes;
