/**
 * Build-time configuration. `environment.development.ts` replaces this file in development
 * builds (see angular.json). Both use the mock backend until the real API exists.
 */
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.example.com/v1',
  useMockApi: true,
};
