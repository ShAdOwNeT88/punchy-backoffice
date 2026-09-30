# Requisiti — Backoffice Punchy

## Scopo

Il backoffice è il lato "banco" di Punchy: dove la piattaforma registra le attività e dove ogni
attività gestisce clienti e tessere che i clienti vedono nell'app mobile. Il modello della tessera è
quello dell'app (`tesserino/docs/specs/2026-09-30-tessere-digitali.md`): un emittente, un
programma `entries` / `monthly` / `loyalty`, un aspetto (`style`, `design`, `stampStyle`, `emblem`).

Fonte: richiesta del committente del 2026-09-30 (vedi [`specs/2026-09-30-backoffice.md`](specs/2026-09-30-backoffice.md)).
I requisiti marcati *(proposta)* colmano punti non specificati e vanno confermati.

### In scope

- Accesso per due ruoli: **admin** della piattaforma e **gestore** di un'attività.
- Admin: attività, gestori, sospensioni.
- Gestore: dati e aspetto dell'attività, tipi di tessera, clienti, tessere, pagamenti, vidimazioni,
  premi.
- Interfaccia in italiano e inglese; SPA pubblicabile su Cloudflare.
- Funzionamento senza backend, su dati demo, finché il backend non esiste.

### Fuori scope

- Registrazione autonoma delle attività (il pitch dice "vi registrate come struttura": per ora le
  crea l'admin; vedi domande aperte).
- Invio di email/inviti ai clienti e ai gestori, recupero password self-service.
- Timbratura con QR/NFC, pagamenti online, scontrini o documenti fiscali, notifiche.
- Tessere a punti con saldo numerico.

## Ruoli e accesso

| ID | Requisito |
|---|---|
| ACC-1 | Login con email e password (≥ 8 caratteri). Email non valida o password corta vengono segnalate prima di chiamare il server. |
| ACC-2 | Dopo il login l'admin arriva a `/admin`, il gestore a `/manager`. Ogni ruolo vede solo la propria area; un URL dell'altra area riporta alla propria home. |
| ACC-3 | La sessione sopravvive al ricaricamento della pagina. "Esci" la termina. |
| ACC-4 | Un gestore sospeso, o di un'attività sospesa, non può accedere e viene disconnesso alla prima richiesta successiva alla sospensione, con il motivo mostrato sulla pagina di login. |
| ACC-5 | Un account cliente non può usare il backoffice: il login lo rimanda all'app. |
| ACC-6 | Ogni utente può cambiare nome, cognome, iniziali e password dal proprio profilo (la password attuale è richiesta). |
| ACC-7 | La lingua (it/en) si sceglie dal login e dalla barra in alto e viene ricordata. |

## Admin

| ID | Requisito |
|---|---|
| ADM-1 | Panoramica: numero di attività (con le sospese), gestori, clienti, tessere attive, vidimazioni negli ultimi 30 giorni; ultime attività create. |
| ADM-2 | Elenco attività con ricerca (nome, città, email, P. IVA), filtro per stato, paginazione; per ognuna gestori, clienti, tessere attive, stato. |
| ADM-3 | Creazione e modifica di un'attività: nome, categoria, sottotitolo, referente, telefono, email, P. IVA, indirizzo, città. L'aspetto della tessera parte da un default e lo cura il gestore. |
| ADM-4 | Dettaglio attività: dati, anteprima della tessera, elenco dei suoi gestori, accesso rapido a "Aggiungi gestore". |
| ADM-5 | Sospendere un'attività, previa conferma, blocca tutti i suoi gestori (ACC-4); riattivarla li ripristina, tranne quelli sospesi singolarmente. Clienti e tessere restano. |
| ADM-6 | Elenco gestori con ricerca, filtro per attività e stato; mostra se l'attività del gestore è sospesa. |
| ADM-7 | Creazione di un gestore con email (unica sulla piattaforma), nome, cognome, iniziali, telefono, attività e **password temporanea** generata (modificabile) da comunicargli. Email già in uso → errore. |
| ADM-8 | Modifica, sospensione/riattivazione (con conferma) e reimpostazione della password temporanea di un gestore. |

## Gestore

| ID | Requisito |
|---|---|
| MGR-1 | Bacheca: vidimazioni di oggi, tessere attive, clienti, incassato nel mese; ricerca rapida di una tessera (numero, nome, email, telefono); elenco "Da gestire" ordinato per urgenza: premio da consegnare, mese in corso non pagato (mensili), scadenza entro 14 giorni, saldo da pagare (ingressi), al massimo 2 ingressi rimasti. |
| MGR-2 | "La mia attività": categoria, sottotitolo, referente, telefono, email, indirizzo, città; logo (PNG/JPEG/SVG/WebP ≤ 1 MB, rimovibile), simbolo di riserva, palette colori, stile `gradient`/`paper`, timbro `round`/`signature`, con **anteprima dal vivo** fronte/retro. Nome e P. IVA li modifica solo l'admin. |
| MGR-3 | Tipi di tessera: nome interno, programma (ingressi, mensilità, fedeltà), numero di caselle (1–60), prezzo del pacchetto o quota mensile, premio (obbligatorio per la fedeltà), validità in giorni (facoltativa), se stampare il titolare. Il programma non cambia dopo la creazione. Le modifiche valgono per le tessere emesse dopo. Un tipo si archivia (non più emettibile) e si ripristina. |
| MGR-4 | Clienti: elenco con ricerca (nome, email, telefono, numero di tessera) e paginazione; creazione e modifica (nome, cognome, email, telefono, data di nascita, note). L'email è ciò con cui il cliente accede all'app: senza email il backoffice lo segnala. Email unica tra i clienti dell'attività. |
| MGR-5 | Eliminazione di un cliente con conferma, rifiutata se ha tessere attive. |
| MGR-6 | Emissione di una tessera a un cliente da un tipo attivo: numero automatico progressivo o quello della tessera di carta (unico nell'attività); scadenza dal tipo o scelta; **caselle già timbrate sulla tessera di carta** da riportare; per gli ingressi, pagamento del pacchetto (anche parziale) e metodo. La tessera compare nell'app del cliente. |
| MGR-7 | Elenco tessere con ricerca, filtro Abbonamenti/Fedeltà e per stato (attiva, completata, scaduta, annullata); per ognuna avanzamento, stato, premio pronto, saldo da pagare. |
| MGR-8 | Dettaglio tessera: anteprima come nell'app, riepilogo (usati, rimanenti o al premio, prezzo, pagato, da saldare, scadenza), storico vidimazioni e pagamenti dal più recente. |
| MGR-9 | **Vidimazione**: ingresso o timbro con data (oggi di default) e nota; per le mensilità si sceglie il mese (i mesi già pagati non sono selezionabili, viene proposto il primo non pagato) e di default si registra insieme il pagamento (importo = quota, metodo). Le iniziali dell'operatore sono quelle del gestore. Una tessera piena o non attiva non si vidima. |
| MGR-10 | **Pagamento** senza vidimazione (pacchetto, acconto, saldo) con importo, metodo, data, nota. |
| MGR-11 | Annullare una vidimazione (anche il pagamento registrato con lei) o eliminare un pagamento, con conferma. |
| MGR-12 | **Premio**: una tessera fedeltà piena mostra "Premio pronto"; il gestore conferma la consegna, la tessera diventa completata e, se scelto, ne viene emessa una nuova vuota. |
| MGR-13 | Modificare numero e scadenza di una tessera; annullarla (resta nello storico, non si vidima più). |

## Regole della tessera

Stabilite dal backend (e dal mock), il backoffice le mostra:

- `completed`: ingressi o mensilità tutte usate, oppure premio consegnato; `expired`: oltre
  `validUntil`; `cancelled`: annullata; altrimenti `active`.
- Una fedeltà è "premio pronto" quando tutte le caselle sono timbrate e il premio non è consegnato.
- Una mensilità si registra una sola volta per mese.
- Quanto resta da pagare di un pacchetto ingressi = prezzo − pagamenti.

## Qualità

- Layout utilizzabile da 360 px di larghezza in su; navigazione laterale a scomparsa sotto 960 px.
- Ogni testo visibile è tradotto; date e importi seguono la lingua scelta.
- Accessibilità: controlli etichettati, focus visibile, template verificati da
  `angular-eslint` (template accessibility).
- Nessun dato di un'attività è visibile a un'altra (`business/*` è sempre riferito al gestore
  autenticato).

## Domande aperte

1. **Registrazione delle attività.** Il pitch dice che le strutture "si registrano": serve anche la
   registrazione autonoma con approvazione dell'admin, o resta l'admin a crearle?
2. **Accesso dei clienti all'app.** Come riceve la password un cliente creato dal gestore (invito
   email con link di attivazione? codice da banco?). Oggi il backoffice registra solo l'email.
3. **Attività sospesa e clienti.** *(proposta)* Le tessere restano visibili nell'app in sola lettura.
   Oppure vanno nascoste?
4. **Più gestori per attività.** *(proposta)* Li crea solo l'admin. Il gestore titolare deve poter
   aggiungere il proprio staff?
5. **Eliminazione cliente.** *(proposta)* Cancellazione definitiva dello storico. Serve invece
   l'anonimizzazione (storico incassi conservato)?
6. **Pagamenti.** Bastano importo, metodo e nota, o servono ricevute/esportazioni per il
   commercialista?
7. **Scadenza delle mensilità.** Per gli abbonamenti mensili il "mese non pagato" scatta dal primo
   del mese: serve un periodo di tolleranza?
