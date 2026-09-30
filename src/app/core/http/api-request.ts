import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '@env/environment';

/** The request description orval's Angular client hands to the mutator. */
export interface ApiRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'get' | 'post' | 'put' | 'patch' | 'delete';
  params?: Record<string, unknown>;
  data?: unknown;
  headers?: Record<string, string>;
  responseType?: string;
}

const API_BASE_URL = environment.apiBaseUrl.replace(/\/+$/, '');

/** Marks the requests addressed to the Punchy API, for the interceptors. */
export function isApiUrl(url: string): boolean {
  return url.startsWith(`${API_BASE_URL}/`);
}

/** Path of an API URL relative to the base URL, e.g. `/business/cards`. */
export function apiPath(url: string): string {
  return url.slice(API_BASE_URL.length).split('?')[0];
}

/**
 * Project-owned mutator used by every generated client: it resolves the base URL, drops empty
 * query parameters and sets the JSON headers. The bearer token is added by `authInterceptor`,
 * because the session lives in dependency injection and the mutator runs outside it.
 */
export function apiRequest<T>(config: ApiRequestConfig, http: HttpClient): Observable<T> {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(config.params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    params = params.set(key, String(value));
  }
  const isFormData = config.data instanceof FormData;
  const headers = new HttpHeaders({
    Accept: 'application/json',
    ...(config.data !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...config.headers,
  });
  return http.request<T>(config.method.toUpperCase(), `${API_BASE_URL}${config.url}`, {
    body: config.data,
    params,
    headers,
    responseType: 'json',
  });
}
