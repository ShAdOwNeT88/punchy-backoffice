import type { Routes } from '@angular/router';
import { provideTranslocoScope } from '@jsverse/transloco';

import { provideTranslatedPaginator } from '@core/i18n/paginator-intl';

/** Customers and their cards are one feature: a card always belongs to a customer. */

export const customerRoutes: Routes = [
  {
    path: '',
    providers: [provideTranslocoScope('customers'), provideTranslatedPaginator()],
    children: [
      { path: '', loadComponent: () => import('./pages/customers-page') },
      { path: ':customerId', loadComponent: () => import('./pages/customer-detail-page') },
    ],
  },
];

export const cardRoutes: Routes = [
  {
    path: '',
    providers: [provideTranslocoScope('customers'), provideTranslatedPaginator()],
    children: [
      { path: '', loadComponent: () => import('./pages/cards-page') },
      { path: ':cardId', loadComponent: () => import('./pages/card-detail-page') },
    ],
  },
];
