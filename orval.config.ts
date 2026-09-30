import { defineConfig } from 'orval';

/**
 * One generated client per consumer level, filtered by OpenAPI tag, so each lands in the
 * data-access unit that owns it (see docs/DECISIONS.md). Input is the committed contract.
 */
const target = (tag: string, dir: string) => ({
  input: {
    target: './openapi/punchy.yaml',
    filters: { tags: [tag] },
  },
  output: {
    mode: 'tags-split' as const,
    client: 'angular' as const,
    target: `${dir}/endpoints`,
    schemas: `${dir}/model`,
    clean: true,
    prettier: true,
    override: {
      angular: { provideIn: 'root' as const },
      mutator: {
        path: './src/app/core/http/api-request.ts',
        name: 'apiRequest',
      },
    },
  },
});

export default defineConfig({
  auth: target('auth', 'src/app/core/auth/api'),
  account: target('account', 'src/app/features/account/data-access/api'),
  admin: target('admin', 'src/app/features/admin/data-access/api'),
  business: target('business', 'src/app/features/manager/data-access/api'),
});
