# Plan — back office v0.1

Executed on 2026-09-30.

1. Scaffold Angular 22.2 (`ng new`, SCSS, no SSR), add Material, angular-eslint, Transloco, orval,
   coverage, wrangler. Path aliases `@core`, `@shared`, `@features`, `@env`, `@mocks`, `@testing`.
2. Write `openapi/punchy.yaml`; generate one client per tag with orval into its owning unit.
3. Mock backend in `src/mocks/`: records, seed relative to today, handlers per tag, interceptor.
4. Core: session, guards, auth interceptor, i18n, notifier, demo token, shell layout.
5. Shared: tokens and theme, card preview, chips, tiles, meter, empty state, confirm dialog,
   formatting pipes, API error mapping.
6. Features: login, account; admin overview, businesses, managers; manager dashboard, business
   profile, templates, customers and cards with the issue, stamp, payment, edit dialogs.
7. Translations it/en, global and per feature scope.
8. Boundary lint rules; verify they fire on a cross-feature import.
9. Tests: mock contract rules, helpers, guards, one smoke spec per page, dialog behaviour.
10. Production build with measured budgets; Cloudflare `wrangler.jsonc`, `_headers`, dry run.
11. Documentation: README, CLAUDE.md, docs/.
