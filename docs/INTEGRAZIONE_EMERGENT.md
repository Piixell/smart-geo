# Integrazione Emergent — 3 novembre 2026

Integrate le modifiche applicative di `emergent-emergent.zip` nel progetto attuale, conservando la correzione locale dei modali in `Varie.tsx` e la configurazione Supabase locale.

## Funzionalità integrate

- Preventivi, prestazioni professionali, sconti, spese interne e due varianti PDF.
- Dashboard, indicatori, collegamenti con filtri e avvisi delle scadenze.
- Agenda per giorno/categoria, inserimento rapido, completamento e spostamento alla settimana successiva.
- Proprietari e recapiti, sincronizzazione rubrica, committenti e tipi di incarico configurabili.
- Filtri e pagamenti delle pratiche, ordinamento per variazione di stato e adattamenti per dispositivi mobili.
- Spese ricorrenti, tasse e contributi, personalizzazione grafica e copia dei dati.
- Loghi, stile, metadati e guida NAS aggiornata alla struttura locale.

Il frontend dell'archivio era in `frontend/`; è stato integrato nella radice esistente. Non sono stati importati il backend dimostrativo FastAPI/MongoDB (non usato dall'app), `.emergent`, report di sessione, screenshot, cache Graphify, istruzioni per altri agenti o backup contenenti dati dei clienti. Questi materiali restano nello ZIP originale e nell'estrazione temporanea. Non sono state eseguite operazioni di pulizia/importazione dei dati descritte nelle memorie Emergent. Il file `.yarnrc` che disabilitava i controlli di compatibilità non è necessario con npm e non è stato importato.

## Attivazione sul database

Il database remoto non è stato modificato. Prima di usare questa versione sul database reale:

1. Eseguire un backup PostgreSQL completo del database attuale.
2. Verificare che sia già applicata `supabase/migrations/202610050001_stati_varie.sql`. È una migrazione preesistente: non sostituire tabelle con nomi simili né eseguire di nuovo gli script di creazione iniziali del repository.
3. Applicare nel SQL Editor del progetto corretto `supabase/migrations/202611030001_integrazione_emergent.sql`.
4. Eseguire `supabase/verifiche_sicurezza.sql`: verificare RLS, assenza di privilegi anonimi e regole di proprietà. Per le due RPC `esegue_come_proprietario` ed `eseguibile_anonimamente` devono essere false.
5. Provare con un account reale lettura/salvataggio di preventivi, pratiche, spese, impostazioni e scaricamento PDF/backup.

La migrazione aggiunge campi e tabelle, regole di accesso e due funzioni per generare spese senza richieste concorrenti duplicate. Non importa utenti o dati Emergent. Se trova tabelle nuove già esistenti senza `user_id`, si interrompe senza attribuire arbitrariamente i dati; occorre esaminare lo schema reale prima di proseguire. Anche i numeri di preventivo duplicati richiedono revisione. I tipi di incarico Varie sono inizializzati dagli incarichi storici già presenti per ciascun utente; nessun elenco clienti viene importato dallo ZIP.

I parametri storici privi di `user_id` rimangono condivisi fra gli utenti autenticati dello stesso studio. Per usare l'app con studi indipendenti occorre una migrazione dedicata di questi parametri. Se l'accesso deve essere riservato agli account esistenti, verificare anche la disattivazione delle nuove registrazioni nel pannello Auth Supabase: nascondere un link nell'interfaccia non modifica tale impostazione.

## Correzioni di sicurezza e conservazione dei dati

- Filtri utente espliciti aggiunti a ricerche, apertura record, backup, rubrica, preventivi, prestazioni, impostazioni e operazioni dell'agenda; SQL con RLS e controllo della proprietà anche sulle scritture.
- Conservata la configurazione Vite locale: non importato `allowedHosts: true`. Vite documenta il rischio di accesso ai sorgenti tramite DNS rebinding quando si abilita ogni host ([documentazione Vite](https://vite.dev/config/server-options.html#server-allowedhosts)).
- Impostazioni validate prima dell'uso: chiavi ammesse, tipi, percentuali, coordinate, date, colori esadecimali e immagini raster in formato data URL. Rimosso l'uso della cache condivisa fra account; stato resettato al cambio account.
- Consultare Contabilità non ricalcola né sovrascrive più lo storico delle fatture. I calcoli restano attivi quando si creano o modificano fatture.
- Gli automatismi delle spese conservano importi già pagati e righe duplicate; le richieste vengono serializzate nel database. Le fatture usate per calcolare gli importi vengono lette per intero con paginazione.
- Propagazione dei contatti tramite nomi normalizzati e ID, senza wildcard; anche la cancellazione di telefono/email si propaga alle pratiche.
- Backup limitato all'utente, ordinato e paginato; un'esportazione incompleta è etichettata come parziale e contiene l'elenco delle tabelle non lette. L'export JSON contiene dati personali in chiaro: conservarlo in una posizione protetta. Non include Auth, password, schema o file Storage e non sostituisce un backup PostgreSQL.
- Aggiunti header HTTP contro incorporamento in iframe e interpretazioni errate dei contenuti; rimossi log informativi/debug dalla build pubblicata.
- Aggiornate dipendenze vulnerabili, inclusi navigazione e validazione, adattato il relativo resolver del modulo di accesso. Il comando build controlla ora esplicitamente sia il progetto TypeScript dell'app sia la configurazione: il precedente `tsc --noEmit` sulla configurazione radice con sole references non controllava i sorgenti.

Le regole lato client non sostituiscono RLS sul database: l'autorizzazione effettiva deve essere verificata nel progetto reale ([documentazione Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security)).

## Verifiche ed esiti

- TypeScript applicazione e configurazione: superati.
- Build di produzione: superata; avviso sulla dimensione dei bundle e commenti di annotazione nelle dipendenze, senza errori di compilazione.
- SQL su PostgreSQL locale temporaneo (PGlite), con schema iniziale rappresentativo: prima applicazione e riesecuzione superate. Verificati isolamento fra due utenti, blocco degli accessi anonimi, scritture per altri utenti respinte, conservazione di pagamenti/doppioni, aggiornamento delle voci non pagate e ricorrenze idempotenti.
- Browser: `/preventivi` senza sessione reindirizza a `/login`; il modulo mostra gli errori locali per email/password vuote con le nuove dipendenze. Nessun accesso a un account reale né modifica remota.
- Audit npm: prima degli aggiornamenti 23 segnalazioni (17 alte, 4 moderate, 2 basse); finale 14 moderate, tutte negli strumenti di sviluppo. Audit `--omit=dev`: **0 vulnerabilità note**.
- Le segnalazioni residue riguardano la catena ESLint/TypeScript ESLint e glob/minimatch/sucrase. Non è stato applicato `audit fix --force`: propone anche cambiamenti incompatibili o retrocessioni di ESLint. Richiedono un aggiornamento dedicato degli strumenti; non equivalgono a 14 difetti sfruttabili nell'app pubblicata.
- Lint: segnala 31 errori e 27 avvisi, contro 31 errori e 17 avvisi rilevati prima dell’importazione; riguardano soprattutto tipizzazioni `any`, destrutturazioni e dipendenze React Hooks. Non è una verifica superata. Nessun framework o file di test è stato aggiunto, come richiesto da AGENTS.md.
- Ricerca di credenziali nei sorgenti/configurazioni: nessuna chiave privata, token GitHub, chiave privilegiata Supabase o password DB in URL individuata. Il `.env` locale già versionato contiene URL e chiave Supabase con ruolo `anon`, destinata al client; non è una chiave amministrativa. `.gitignore` ora esclude `.env` e varianti, ma il file già tracciato e la cronologia richiedono rimozione dal versionamento separata se desiderata. Aggiunto `.env.example` senza valori reali.

Questa revisione verifica codice e schema locale; non certifica configurazione, policy, utenti, Storage o funzioni del database Supabase remoto. Non è stato eseguito un penetration test e non è stata effettuata una pubblicazione.

## Ripristino e materiali di confronto

Prima delle modifiche è stata salvata una copia dei file sostituiti in:

`C:\Users\Marco\AppData\Local\Temp\smart-geo-integrazione-8hq87hp0\prima-integrazione.zip`

Nella stessa cartella sono presenti lo ZIP estratto, `varie-locale.tsx` e `inventario.json`. La copia non comprende i successivi file aggiunti: per il ripristino usare l'inventario e il diff Git, conservando qualunque modifica fatta dopo questa sessione. Le cartelle temporanee possono essere ripulite dal sistema: per conservare questi materiali copiarli in una posizione di archivio protetta.

Un rollback dell'app non richiede cancellare le nuove colonne o tabelle: conservarle evita perdita dei dati inseriti dopo l'attivazione. Non è stato creato uno script di cancellazione dei dati.
