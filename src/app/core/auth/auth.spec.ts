import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { type ActivatedRouteSnapshot, Router, type RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';

import { environment } from '@env/environment';

import type { User } from './api/model';
import { authInterceptor } from './auth.interceptor';
import { authGuard, guestGuard, homeRedirect, roleGuard } from './guards';
import { homePath } from './home-path';
import { Session } from './session';

const manager: User = { id: 'u1', email: 'm@example.com', firstName: 'M', lastName: 'R', role: 'manager', businessId: 'b1' };
const API = environment.apiBaseUrl;

describe('auth', () => {
  let session: Session;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    session = TestBed.inject(Session);
  });

  const run = <T>(fn: () => T) => TestBed.runInInjectionContext(fn);
  const route = {} as ActivatedRouteSnapshot;
  const state = (url: string) => ({ url }) as RouterStateSnapshot;
  const url = (result: unknown) => (result instanceof UrlTree ? result.toString() : result);

  it('persists the session across reloads', () => {
    session.start('t', manager);
    expect(JSON.parse(localStorage.getItem('punchy.session')!).token).toBe('t');
    session.end();
    expect(localStorage.getItem('punchy.session')).toBeNull();
  });

  it('sends signed-out users to login, keeping where they were going', () => {
    expect(url(run(() => authGuard(route, state('/manager/cards'))))).toBe('/login?returnUrl=%2Fmanager%2Fcards');
    session.start('t', manager);
    expect(run(() => authGuard(route, state('/manager')))).toBe(true);
  });

  it('keeps each role in its own area', () => {
    session.start('t', manager);
    expect(run(() => roleGuard('manager')(route as never, [], {} as never))).toBe(true);
    expect(url(run(() => roleGuard('admin')(route as never, [], {} as never)))).toBe('/manager');
    expect(url(run(() => guestGuard(route, state('/login'))))).toBe('/manager');
    expect(url(run(() => homeRedirect(route, state('/'))))).toBe('/manager');
    expect(homePath('admin')).toBe('/admin');
    expect(homePath(null)).toBe('/login');
  });

  it('adds the token to API calls only', () => {
    session.start('secret', manager);
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    http.get(`${API}/business`).subscribe();
    http.get('i18n/it.json').subscribe();
    expect(controller.expectOne(`${API}/business`).request.headers.get('Authorization')).toBe('Bearer secret');
    expect(controller.expectOne('i18n/it.json').request.headers.has('Authorization')).toBe(false);
  });

  it('ends the session when the API rejects the token', () => {
    session.start('secret', manager);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    TestBed.inject(HttpClient).get(`${API}/business`).subscribe({ error: () => undefined });
    TestBed.inject(HttpTestingController)
      .expectOne(`${API}/business`)
      .flush({ code: 'business_suspended' }, { status: 401, statusText: 'Unauthorized' });
    expect(session.isSignedIn()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reason: 'business_suspended' } });
  });
});
