import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { apiPath, isApiUrl } from '../http/api-request';
import { Session } from './session';

/**
 * Adds the bearer token to API calls and ends the session when the API rejects it, e.g. after an
 * admin suspends the account or its business.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url)) return next(req);
  const session = inject(Session);
  const router = inject(Router);
  const token = session.token();
  const authorized = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        apiPath(req.url) !== '/auth/login' &&
        session.isSignedIn()
      ) {
        const reason = (error.error as { code?: string } | null)?.code ?? 'unauthorized';
        session.end();
        void router.navigate(['/login'], { queryParams: { reason } });
      }
      return throwError(() => error);
    }),
  );
};
