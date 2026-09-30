import type { Routes } from '@angular/router';

import { authGuard, guestGuard, homeRedirect, roleGuard } from '@core/auth/guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadChildren: () => import('@features/login/login.routes'),
  },
  {
    path: '',
    loadComponent: () => import('@core/layouts/shell/shell').then((m) => m.Shell),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeRedirect], children: [] },
      {
        path: 'admin',
        canMatch: [roleGuard('admin')],
        children: [
          { path: '', loadChildren: () => import('@features/admin/overview/overview.routes') },
          { path: 'businesses', loadChildren: () => import('@features/admin/businesses/businesses.routes') },
          { path: 'managers', loadChildren: () => import('@features/admin/managers/managers.routes') },
        ],
      },
      {
        path: 'manager',
        canMatch: [roleGuard('manager')],
        children: [
          { path: '', loadChildren: () => import('@features/manager/dashboard/dashboard.routes') },
          { path: 'business', loadChildren: () => import('@features/manager/business-profile/business-profile.routes') },
          { path: 'templates', loadChildren: () => import('@features/manager/templates/templates.routes') },
          {
            path: 'customers',
            loadChildren: () => import('@features/manager/customers/customers.routes').then((m) => m.customerRoutes),
          },
          {
            path: 'cards',
            loadChildren: () => import('@features/manager/customers/customers.routes').then((m) => m.cardRoutes),
          },
        ],
      },
      {
        path: 'account',
        loadChildren: () => import('@features/account/account.routes'),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
