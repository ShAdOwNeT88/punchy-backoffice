import { HttpErrorResponse } from '@angular/common/http';

/** Codes of `ApiError` (openapi/punchy.yaml) plus `network`; each has an `errors.<code>` key. */
const KNOWN_CODES = [
  'network',
  'invalid_credentials',
  'account_suspended',
  'business_suspended',
  'unauthorized',
  'forbidden',
  'not_found',
  'validation_error',
  'wrong_password',
  'email_taken',
  'card_number_taken',
  'template_archived',
  'card_full',
  'card_not_active',
  'period_already_paid',
  'reward_not_ready',
  'customer_has_active_cards',
  'logo_invalid',
];

/** The stable `code` of an `ApiError`, `network` when the server could not be reached, or `unknown`. */
export function apiErrorCode(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'network';
    const code = (error.error as { code?: unknown } | null)?.code;
    if (typeof code === 'string') return code;
  }
  return 'unknown';
}

/** Translation key describing an API failure to the user. */
export function apiErrorKey(error: unknown): string {
  const code = apiErrorCode(error);
  return KNOWN_CODES.includes(code) ? `errors.${code}` : 'errors.unknown';
}
