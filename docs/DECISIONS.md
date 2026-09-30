# Technical decisions

Consequential choices of the back office, including the declared choices at the variation points
of the house Angular architecture (Seshat) and any declared deviations. Supersede entries; never
rewrite them.

Status values: **Proposed**, **Accepted**, **Superseded**, **Deprecated**.

## Accepted decisions

### Stack: Angular 22.2, Material 22, Transloco, Vitest

- **Date:** 2026-09-30
- **Status:** Accepted
- **Source:** Client request ("l'ultima versione di Angular … seshat web").

#### Context

A back office for the Punchy mobile app, built with the latest Angular and the house guidelines.

#### Decision

Angular 22.2 (standalone, signals, zoneless, `@angular/build` application builder, Vitest through
`@angular/build:unit-test`), Angular Material 22 with an M3 theme generated from the mobile app's
brand colours, Transloco 8 (house library), reactive forms only, ESLint with angular-eslint.
Node 24 LTS for development (Angular 22 requires ≥ 22.22.3).

#### Alternatives considered

A custom design system: slower to reach accessible tables, dialogs and form fields; the mobile
app's look is carried by the tokens and the card preview instead.

#### Consequences

The Material bundle weighs on the initial chunk; the shell layout is lazy-loaded to keep the
initial bundle at 537 kB.

### Features grouped by actor

- **Date:** 2026-09-30
- **Status:** Accepted
- **Source:** House rule "group features above eight".

#### Decision

Ten features: `login`, `account`, and two groups named after the actors, `admin`
(`overview`, `businesses`, `managers`) and `manager` (`dashboard`, `business-profile`,
`templates`, `customers`). Each group owns a `data-access`. Customers and cards are one feature
(`manager/customers`) because every card belongs to a customer and the two screens share their
dialogs.

#### Consequences

Boundaries are enforced by `no-restricted-imports` in `eslint.config.js` (a regex per feature).
Dialogs used by two screens of one feature stay in that feature's `components/`.

### Generated clients, one orval target per tag

- **Date:** 2026-09-30
- **Status:** Accepted
- **Source:** House rule "HTTP clients"; no backend exists.

#### Context

There is no upstream OpenAPI document: the backend will be written after the back office.

#### Decision

The contract is written first and committed as `openapi/punchy.yaml`; it also documents the
mobile app's endpoints (tag `customer-app`, not generated here). orval generates one client per
tag into the unit that owns it (`core/auth/api`, `features/account/data-access/api`,
`features/admin/data-access/api`, `features/manager/data-access/api`), so the promotion rule
holds for generated code too.

#### Consequences

Common schemas (e.g. `AccountStatus`) are generated in more than one place; generated code is
never edited, linted or covered. Until the backend team adopts the document it is a proposal, a
recorded gap rather than a house deviation.

### Declared deviation: the mutator does not add the bearer token

- **Date:** 2026-09-30
- **Status:** Accepted
- **Source:** House rule "a project-owned mutator supplying base URL, authentication, and headers".

#### Context

orval's Angular mutator is a plain function called from the generated service methods, outside
an injection context, while the session is a signal in dependency injection.

#### Decision

`core/http/api-request.ts` supplies base URL and headers; `core/auth/auth.interceptor.ts` adds
the token and ends the session on 401. External constraint: the generated Angular client offers
no injection context to its mutator.

#### Consequences

Authentication is in one interceptor that applies to API URLs only (`isApiUrl`).

### Mock backend in the browser until the real one exists

- **Date:** 2026-09-30
- **Status:** Accepted
- **Source:** Client ("per ora non abbiamo un BE … sarebbero da mockare i dati").

#### Decision

`src/mocks/` implements the contract and is wired as the last HTTP interceptor when
`environment.useMockApi` is true (both environments today). It persists to `localStorage` so a
demo survives reloads, seeds data relative to the current date, and offers demo accounts and a
reset on the login page through the `DEMO_MODE` token. Features never import `src/mocks/` (lint
rule); only `app.config.ts` and the test helpers do. It mirrors the mobile app's `Mock*Service`
decision: the interfaces (here the generated clients) stay when the mock goes.

#### Consequences

The Cloudflare deployment is a working demo with per-browser data. The mock's rules are tested as
the executable reading of the contract. When the backend is live, set `useMockApi: false` and
remove the mock from production builds.

### Design tokens, as in the mobile app

- **Date:** 2026-09-30
- **Status:** Accepted

#### Decision

No hex colour or raw length outside `src/styles/`. Components use `--app-*` custom properties and
the `.card-style--*` palettes, which repeat the mobile app's `AppColors` and `CardPalette`.

### Cloudflare: Workers static assets with SPA fallback

- **Date:** 2026-09-30
- **Status:** Accepted
- **Source:** Client ("single page application … deployare su cloudflare").

#### Decision

`wrangler.jsonc` publishes `dist/punchy-backoffice/browser` as static assets with
`not_found_handling: "single-page-application"`. Cloudflare Pages remains possible with the same
output directory.

### Bundle budgets set from the measured build

- **Date:** 2026-09-30
- **Status:** Accepted

#### Decision

Initial bundle: warning 580 kB, error 650 kB (measured 537 kB). Component styles: 5 kB / 8 kB
(the card preview is 4.4 kB). Revise them when the mock leaves the production bundle.

## Maintenance

Do not rewrite an accepted decision to match a later choice. Add a new dated entry and mark the
old one as superseded.
