import { InjectionToken } from '@angular/core';

/**
 * Present only while the app runs on the mock backend: the demo accounts to offer on the login
 * page and a way to restore the demo data.
 */
export interface DemoMode {
  accounts: { role: 'admin' | 'manager'; email: string; password: string }[];
  reset(): void;
}

export const DEMO_MODE = new InjectionToken<DemoMode | null>('DEMO_MODE', {
  factory: () => null,
});
