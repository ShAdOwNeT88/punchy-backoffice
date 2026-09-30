import type { Role } from './api/model';

/** Where each role lands after signing in. */
export function homePath(role: Role | null): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'manager':
      return '/manager';
    default:
      return '/login';
  }
}
