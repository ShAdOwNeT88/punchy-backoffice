# Backoffice Punchy — v0.1

## Richiesta

Il committente ha l'app mobile Punchy (tessere digitali: ingressi, mensilità, fedeltà) e chiede il
backoffice web:

- Angular all'ultima versione, secondo le linee guida Seshat web;
- un accesso **admin** e un accesso **gestore dell'attività**;
- l'admin aggiunge attività e gestori e può **inibire** un'attività e i suoi gestori;
- il gestore cura i dettagli della propria attività, registra clienti con tessera (abbonamento o
  fedeltà), registra i pagamenti e la relativa **vidimazione**;
- recuperare dalla documentazione mobile i dettagli mancanti;
- single page application pubblicabile su Cloudflare;
- il backend non esiste ancora: i dati vanno mockati.

Dal pitch del prodotto: il gestore personalizza la tessera (logo, colori, contatti), vede chi ha
pagato, quanti ingressi restano, quanti trattamenti al premio e le scadenze; il cliente vede nel
telefono la tessera uguale a quella di carta, fronte e retro.

## Punti colmati

Dove la richiesta taceva, il progetto ha scelto (e `REQUIREMENTS.md` marca come proposta):

- **Tipi di tessera** (`CardTemplate`): ciò che l'attività vende o regala, da cui si emette ogni
  tessera; porta programma, caselle, prezzo o premio, validità, stampa del titolare. Le tessere
  emesse copiano le condizioni, così cambiare un listino non altera le tessere vendute.
- **Pagamenti separati dai timbri**: un pacchetto ingressi si paga (anche a rate) e poi si vidima
  a ogni ingresso; una mensilità si vidima e si paga insieme; una fedeltà si timbra soltanto.
- **Migrazione dal cartaceo**: all'emissione si può riportare il numero della tessera di carta e le
  caselle già timbrate.
- **Premio**: consegna esplicita con eventuale nuova tessera vuota.
- **Correzioni**: annullare una vidimazione o un pagamento sbagliati.
- **"Da gestire"**: la bacheca elenca premi pronti, mesi non pagati, scadenze vicine, saldi e
  pacchetti quasi finiti.
- **Password dei gestori**: l'admin genera una password temporanea da comunicare; il gestore la
  cambia dal profilo.
- **Iniziali dell'operatore**: dal profilo del gestore, stampate sui timbri come nella tessera di
  carta.
- **Email del cliente** = accesso all'app; senza email la tessera esiste solo nel backoffice.
- **Contratto API** scritto prima del backend, comprese le chiamate dell'app mobile.

## Esito

Implementato come descritto in [`../REQUIREMENTS.md`](../REQUIREMENTS.md) e
[`../TECHNICAL.md`](../TECHNICAL.md); scelte in [`../DECISIONS.md`](../DECISIONS.md).
