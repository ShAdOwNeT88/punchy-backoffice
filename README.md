# Punchy · Backoffice

The web back office of Punchy: paper punch
cards, stamped digitally. An Angular 22 single page application, deployable as a static site on
Cloudflare.

- **Admin** — registers businesses and their managers; can suspend a business (and all of its
  managers with it) or a single manager; resets passwords.
- **Manager** — maintains the business details and the card's look (logo, colours, style), defines
  the card types (entries, monthly passes, loyalty), manages the customer registry, issues cards,
  records payments and validations, hands out rewards.

Requirements: [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) · Implementation:
[`docs/TECHNICAL.md`](docs/TECHNICAL.md) · Decisions: [`docs/DECISIONS.md`](docs/DECISIONS.md) ·
API contract: [`openapi/punchy.yaml`](openapi/punchy.yaml).

## Getting started

Requires Node ≥ 22.22.3 (or 24.15+).

```bash
npm install
npm start
```

Open <http://localhost:4200>. The backend does not exist yet: every API call is served by an
**in-browser mock backend** (`src/mocks/`), with demo data kept in `localStorage`. The login page
shows two buttons to sign in as admin or as manager, and one to reset the demo data. The demo
credentials are in [`src/mocks/seed.ts`](src/mocks/seed.ts).

## Commands

| Command | What it does |
|---|---|
| `npm start` | Development server |
| `npm run build` | Production build into `dist/punchy-backoffice/browser` |
| `npm test` | Tests (Vitest) in watch mode; `npm run test:coverage` for a single run with coverage |
| `npm run lint` | ESLint, including the feature boundary rules |
| `npm run api:generate` | Regenerates the HTTP clients from `openapi/punchy.yaml` (orval) |
| `npm run deploy` | Builds and publishes to Cloudflare (`wrangler deploy`) |

## Deploying to Cloudflare

`wrangler.jsonc` publishes the build as a static-assets-only Worker with
`not_found_handling: "single-page-application"`: every unknown URL returns `index.html` and the
Angular router does the rest. `public/_headers` sets caching and security headers.

```bash
npx wrangler login
npm run deploy
```

Alternatively, with Cloudflare Pages: build command `npm run build`, output directory
`dist/punchy-backoffice/browser`.

## Connecting the real backend

1. The backend implements [`openapi/punchy.yaml`](openapi/punchy.yaml).
2. In `src/environments/environment.ts` (production) and `environment.development.ts`, set
   `apiBaseUrl` and `useMockApi: false`.
3. If the contract changes: update `openapi/punchy.yaml`, then run `npm run api:generate`.

## Structure

```
src/
├── app/
│   ├── core/                  session, guards, interceptors, i18n, notifications, layout
│   ├── features/
│   │   ├── login/  account/
│   │   ├── admin/             overview · businesses · managers · data-access (admin client)
│   │   └── manager/           dashboard · business-profile · templates · customers
│   │                          · data-access (business client, store, read rules)
│   └── shared/                ui (card preview, chips, tiles…) · util (formatting, errors)
├── mocks/                     mock backend: seed, rules, per-resource handlers
├── testing/                   test helpers
├── environments/
└── styles/                    colour and size tokens, Material palette
public/i18n/                   it/en translations, one file per feature
openapi/punchy.yaml            backend contract (also used by the mobile app)
```
