import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { provideTranslatedPaginator } from '@core/i18n/paginator-intl';

export default [
  {
    path: '',
    providers: [provideTranslocoScope('managers'), provideTranslatedPaginator()],
    loadComponent: () => import('./pages/managers-page'),
  },
] satisfies Routes;
