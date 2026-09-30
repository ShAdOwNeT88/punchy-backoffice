# Punchy · Backoffice

Il backoffice web di Punchy (l'app mobile è nel repository `tesserino`), le tessere cartacee da
timbrare in digitale. Single page application Angular 22, pubblicabile come sito statico su
Cloudflare.

- **Admin** — registra le attività e i loro gestori; può sospendere un'attività (e con lei tutti i
  suoi gestori) o un singolo gestore; reimposta le password.
- **Gestore** — cura i dati dell'attività e l'aspetto della tessera (logo, colori, stile), definisce i
  tipi di tessera (ingressi, mensilità, fedeltà), gestisce l'anagrafica clienti, emette le tessere,
  registra pagamenti e vidimazioni, consegna i premi.

Requisiti: [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) · Implementazione:
[`docs/TECHNICAL.md`](docs/TECHNICAL.md) · Scelte: [`docs/DECISIONS.md`](docs/DECISIONS.md) ·
Contratto API: [`openapi/punchy.yaml`](openapi/punchy.yaml).

## Avvio

Serve Node ≥ 22.22.3 (o 24.15+).

```bash
npm install
npm start
```

Apri <http://localhost:4200>. Il backend non esiste ancora: ogni chiamata API è servita da un
**backend mock nel browser** (`src/mocks/`), con dati demo che restano nel `localStorage`. La pagina
di login mostra due pulsanti per entrare come admin o come gestore e uno per ripristinare i dati
demo. Le credenziali demo sono in [`src/mocks/seed.ts`](src/mocks/seed.ts).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm start` | Server di sviluppo |
| `npm run build` | Build di produzione in `dist/punchy-backoffice/browser` |
| `npm test` | Test (Vitest) in watch; `npm run test:coverage` per una sola esecuzione con coverage |
| `npm run lint` | ESLint, comprese le regole sui confini tra feature |
| `npm run api:generate` | Rigenera i client HTTP da `openapi/punchy.yaml` (orval) |
| `npm run deploy` | Build e pubblicazione su Cloudflare (`wrangler deploy`) |

## Deploy su Cloudflare

`wrangler.jsonc` pubblica la build come Worker con soli asset statici e
`not_found_handling: "single-page-application"`: ogni URL sconosciuto restituisce `index.html` e il
router di Angular fa il resto. `public/_headers` imposta cache e intestazioni di sicurezza.

```bash
npx wrangler login
npm run deploy
```

In alternativa, con Cloudflare Pages: build command `npm run build`, output directory
`dist/punchy-backoffice/browser`.

## Collegare il backend vero

1. Il backend implementa [`openapi/punchy.yaml`](openapi/punchy.yaml).
2. In `src/environments/environment.ts` (produzione) e `environment.development.ts` imposta
   `apiBaseUrl` e `useMockApi: false`.
3. Se il contratto cambia: aggiorna `openapi/punchy.yaml`, poi `npm run api:generate`.

## Struttura

```
src/
├── app/
│   ├── core/                  sessione, guard, interceptor, i18n, notifiche, layout
│   ├── features/
│   │   ├── login/  account/
│   │   ├── admin/             overview · businesses · managers · data-access (client admin)
│   │   └── manager/           dashboard · business-profile · templates · customers
│   │                          · data-access (client business, store, regole di lettura)
│   └── shared/                ui (anteprima tessera, chip, tile…) · util (formati, errori)
├── mocks/                     backend mock: seed, regole, handler per risorsa
├── testing/                   helper dei test
├── environments/
└── styles/                    token di colore e dimensione, palette Material
public/i18n/                   traduzioni it/en, un file per feature
openapi/punchy.yaml            contratto con il backend (anche per l'app mobile)
```
