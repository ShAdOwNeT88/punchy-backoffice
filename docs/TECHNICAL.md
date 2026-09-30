# Technical documentation

## System context

A static single-page application (Angular 22.2, zoneless, standalone components, signals) served
by Cloudflare. It talks to one REST backend whose contract is [`openapi/punchy.yaml`](../openapi/punchy.yaml);
the same contract serves the mobile app (tag `customer-app`). **The backend does not exist yet**:
`environment.useMockApi` is `true` in every build, and an HTTP interceptor answers every API call
in the browser (see [Mock backend](#mock-backend)).

## Layout

```
src/app/
├── app.config.ts / app.routes.ts   bootstrap wiring and the route table
├── core/
│   ├── auth/            Session (signal + localStorage), guards, authInterceptor, generated auth client
│   ├── http/            api-request.ts: the orval mutator (base URL, JSON headers, empty params dropped)
│   ├── i18n/            Transloco setup, HTTP loader, LanguagePreference
│   ├── notifications/   Notifier (snack bar)
│   ├── demo/            DEMO_MODE token: demo accounts and reset, provided only on the mock
│   └── layouts/shell/   the signed-in frame (sidenav per role, account menu, router-outlet)
├── features/
│   ├── login/                       sign-in page
│   ├── account/                     profile + password; owns the `account` client
│   ├── admin/
│   │   ├── data-access/api/         generated `admin` client (consumed by the three features)
│   │   ├── overview/ businesses/ managers/
│   └── manager/
│       ├── data-access/             generated `business` client, MyBusinessStore, card-view.ts
│       ├── dashboard/ business-profile/ templates/
│       └── customers/               customers and cards pages, dialogs, CardActions
└── shared/
    ├── ui/        card-preview, status-chip, stat-tile, progress-meter, empty-state, confirm-dialog
    └── util/      format (+ pipes), api-error, icons
src/mocks/         the mock backend
src/testing/       render-page and dialog-harness for specs
src/styles/        _tokens.scss (every colour and length), _theme-colors.scss (Material palettes)
```

Ten features sit in two domain groups named after the actors (`admin`, `manager`), plus `login` and
`account`. Each group owns a `data-access` consumed only inside it. `customers` holds both the
customer and the card pages because a card always belongs to a customer.

## Routing and access

`app.routes.ts` lazy-loads every page. `/login` is guarded by `guestGuard`; everything else sits
under the lazily loaded `Shell` with `authGuard`. `/admin/**` and `/manager/**` use
`roleGuard(role)` as `canMatch`, which redirects other roles to their own home (`homePath`).
Route parameters and query parameters reach pages as signal inputs
(`withComponentInputBinding`), e.g. `?new=1` opens a creation dialog and `?q=` pre-fills the card
search.

`authInterceptor` adds `Authorization: Bearer <token>` to API URLs only. A 401 on any call other
than login ends the session and navigates to `/login?reason=<code>`; this is how a suspension
reaches a signed-in manager.

## HTTP clients

orval 8 generates Angular services from `openapi/punchy.yaml`, one target per tag so each client
lands in the unit that owns it (`orval.config.ts`):

| Tag | Output | Consumers |
|---|---|---|
| `auth` | `core/auth/api` | login page, auth |
| `account` | `features/account/data-access/api` | account page |
| `admin` | `features/admin/data-access/api` | overview, businesses, managers |
| `business` | `features/manager/data-access/api` | the manager features |
| `customer-app` | not generated | mobile app only |

Mode `tags-split`, Angular client, `providedIn: 'root'`, `clean: true`, mutator
`core/http/api-request.ts`. Generated folders (`**/api/endpoints`, `**/api/model`) are excluded
from lint and coverage.

## State

No state library. Pages hold their data in `rxResource`s whose params are signals (search text
debounced from a form control, filters, page). Mutations go through the generated client and then
`set` or `reload` the resource. `MyBusinessStore` (root) caches the manager's business for the
profile page and the card previews, and refetches when another manager signs in.

`card-view.ts` holds the read-side helpers of the manager domain: remaining boxes, balance due,
payable months of a monthly card, status tones, and the mapping to `CardPreviewData`. The card
rules themselves (status, reward readiness, attention reasons) belong to the backend.

## UI

Angular Material 22 (M3) themed from the brand colours of the mobile app
(`#2451E6` primary, `#00B3A4` tertiary). Every colour and length is a `--app-*` custom property in
`src/styles/_tokens.scss`; card palettes are `.card-style--<style>` classes with `--card-g1..3`
and `--card-ink`. `CardPreview` renders the front (gradient or printed "paper" design, logo or
emblem, holder or reward, contact) and the back (stamp grid with the mobile app's column rule,
round stamps or pen initials, reward box), flipping in 3D.

Forms are reactive forms only. Dialogs use `panelClass: 'app-dialog'`; their content is one flex
column with a single gap (`styles.scss`), grouped with `.dialog-section`, `.dialog-lead` and
`.dialog-hint` instead of per-dialog margins. A `mat-select` whose options are translated declares a
`<mat-select-trigger>`: the select caches its label on first render and would otherwise show an
empty value. The active language is loaded by an app initializer before the first render.
Paginator labels come from `TranslatedPaginatorIntl`, provided on the list routes to keep the
paginator out of the initial bundle.

## Internationalisation

Transloco 8. Global keys (`common`, `nav`, `validation`, `errors`, enum labels, `cardPreview`,
`progress`) in `public/i18n/<lang>.json`; one lazy scope per feature in
`public/i18n/<scope>/<lang>.json`, provided on the feature's route. The language is remembered in
`localStorage` (`punchy.lang`); default from the browser, fallback `it`. Dates and amounts go
through `DayPipe`, `MonthPipe`, `MoneyPipe` (Intl, active language, EUR).

## Mock backend

`src/mocks/` implements every `auth`, `account`, `admin` and `business` operation:

- `mock-backend.ts` — route table, token → user, role and suspension checks, save on change.
- `handlers/*.ts` — one file per tag, applying the contract's rules and error codes.
- `views.ts` — records → API shapes; `cardStatus`, `rewardReady`, `attentionReason`.
- `seed.ts` — demo data relative to today (5 businesses, one suspended; 7 managers; ~30 customers;
  cards in every state). Demo accounts are listed at the top of the file.
- `mock-db.ts` — persistence in `localStorage` (`punchy.mock-db`), reset from the login page.
- `mock-backend.interceptor.ts` — registered after `authInterceptor`, 250 ms latency.

Tokens are `mock.<userId>`; passwords are stored in clear in the browser. It is a demo stand-in,
not a security boundary.

## Operations

- `npm start` — dev server; `npm run build` — production build to `dist/punchy-backoffice/browser`.
- Cloudflare: `wrangler.jsonc` publishes that directory as Workers static assets with
  `not_found_handling: "single-page-application"`; `public/_headers` sets security headers,
  `no-cache` for `index.html` and translations, immutable caching for hashed bundles.
  `npm run deploy` = build + `wrangler deploy`. Verified with `wrangler deploy --dry-run`.
- Budgets (production): initial 580 kB warning / 650 kB error (measured 537 kB raw, 133 kB
  transferred on 2026-09-30); component styles 5 kB / 8 kB.

## Testing and verification

```bash
npm run lint            # ESLint + boundary rules
npm run test:coverage   # Vitest via @angular/build:unit-test, v8 coverage
npm run build
```

- `src/mocks/mock-backend.spec.ts` — the contract's rules: auth, suspensions, roles, issuing,
  monthly payments, undo, completion, loyalty redemption, isolation between businesses.
- One smoke spec next to every routed page (`renderPage` renders it against the mock, signed in).
- Behavioural specs for the dialogs with logic (`stamp-dialog`, `template-form-dialog`), `auth`,
  `card-view`, `format`, `api-error`, `temporary-password`.

Coverage on 2026-09-30: 62 tests, 67 % statements, 64 % branches; see [Known limitations](#known-limitations-and-open-evidence).

## Known limitations and open evidence

- No backend: the OpenAPI document is a proposal; the mock is the only implementation.
- Coverage is below the house floors for several dialogs and the mock handlers (overall 64 %
  branches). The ratchet baseline starts here; dialogs without specs are listed by
  `npm run test:coverage`.
- `ng-review`'s measurement script needs Python, which was not available when the project was
  created; the review was not run.
- The mock is bundled in production builds while `useMockApi` is `true`; once the backend exists,
  swap it out with a file replacement so it is tree-shaken.
