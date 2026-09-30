import { inject } from '@angular/core';
import { type CanActivateFn, type CanMatchFn, Router } from '@angular/router';

import type { Role } from './api/model';
import { homePath } from './home-path';
import { Session } from './session';

/** Lets signed-in users through; sends everyone else to the login page. */
export const authGuard: CanActivateFn = (_route, state) => {
  const session = inject(Session);
  if (session.isSignedIn()) return true;
  return inject(Router).createUrlTree(['/login'], {
    queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : {},
  });
};

/** Keeps the login page for signed-out users. */
export const guestGuard: CanActivateFn = () => {
  const session = inject(Session);
  return session.isSignedIn() ? inject(Router).parseUrl(homePath(session.role())) : true;
};

/** Matches a route only for the given role; other roles are sent to their own home. */
export function roleGuard(role: Role): CanMatchFn {
  return () => {
    const session = inject(Session);
    if (session.role() === role) return true;
    return inject(Router).parseUrl(homePath(session.role()));
  };
}

/** Redirects the root URL to the home of the signed-in role. */
export const homeRedirect: CanActivateFn = () =>
  inject(Router).parseUrl(homePath(inject(Session).role()));
