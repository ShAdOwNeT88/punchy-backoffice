import {
  HttpErrorResponse,
  type HttpEvent,
  type HttpInterceptorFn,
  HttpResponse,
} from '@angular/common/http';
import { type Observable, defer, delay, from, mergeMap, of, throwError } from 'rxjs';

import { apiPath, isApiUrl } from '@core/http/api-request';

import { MockBackend } from './mock-backend';
import { clearDb } from './mock-db';

const LATENCY_MS = 250;
let backend: MockBackend | null = null;

function instance(): MockBackend {
  backend ??= new MockBackend();
  return backend;
}

/** Throws away every change made in the browser and restores the demo data. */
export function resetMockData(): void {
  clearDb();
  backend = null;
}

/**
 * Answers every request to the API from `MockBackend`, so the back office runs without a server.
 * Registered last, after the interceptors that add the token and handle errors.
 */
export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isApiUrl(req.url)) return next(req);
  const query: Record<string, string> = {};
  for (const key of req.params.keys()) query[key] = req.params.get(key) ?? '';
  const auth = req.headers.get('Authorization');
  const response$: Observable<HttpEvent<unknown>> = defer(() =>
    from(
      instance().handle({
        method: req.method,
        path: apiPath(req.url),
        query,
        body: req.body,
        token: auth?.startsWith('Bearer ') ? auth.slice(7) : null,
      }),
    ),
  ).pipe(
    delay(LATENCY_MS),
    mergeMap(({ status, body }) =>
      status < 400
        ? of(new HttpResponse({ status, body, url: req.url }))
        : throwError(() => new HttpErrorResponse({ status, error: body, url: req.url })),
    ),
  );
  return response$;
};
