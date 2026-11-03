# Guida: installare il gestionale sul NAS

Il gestionale è fatto di due parti:
1. **Il programma** (le pagine che vedi): è un sito "statico", cioè un insieme di file. Va bene qualsiasi NAS.
2. **I dati** (pratiche, fatture, rubrica…): oggi stanno in un database Supabase online, sul piano gratuito.

## Strada A, consigliata: programma sul NAS, dati su Supabase gratuito
- Verifica sul pannello Supabase limiti, costi, sospensione per inattività e disponibilità dei backup del tuo piano.
- Conserva copie dei dati fuori dal servizio: Parametri → Copia di sicurezza scarica i record accessibili all’account, senza utenti Auth, password, file Storage o schema SQL. Non equivale a un backup PostgreSQL ripristinabile.

Passaggi (con l'aiuto di un tecnico o seguendo la procedura del NAS):
1. Usa il progetto integrato nella cartella attuale, che contiene `package.json`.
2. Nella cartella principale crea il file `.env` con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (gli stessi valori di adesso).
3. Esegui `npm ci --legacy-peer-deps` e poi `npm run build`. Ottieni la cartella `dist`. Prima di pubblicare applica le migrazioni indicate in `docs/INTEGRAZIONE_EMERGENT.md`.
4. Sul NAS:
   - **Synology**: installa "Web Station", crea un sito web e carica il contenuto di `dist`. Imposta "pagina di errore 404 → index.html", così si riaprono le pagine interne.
   - **QNAP**: abilita "Web Server" e copia `dist` nella cartella `Web`. In alternativa usa Container Station con l'immagine `nginx`.
5. Accesso da fuori casa in sicurezza: **non aprire le porte del router**. Usa una VPN:
   - **Tailscale**: gratuito, c'è l'app per Synology e QNAP, e la installi anche su telefono e PC.
   - **QuickConnect** (Synology) o **myQNAPcloud** (QNAP).

   Così il gestionale lo vedono solo i tuoi dispositivi.

## Strada B: tutto sul NAS, anche i dati
- Serve un NAS con Docker (Container Manager su Synology, Container Station su QNAP) e almeno 4 GB di RAM.
- Si installa "Supabase self-hosted" con Docker, poi si trasferiscono i dati e si cambia l'indirizzo nel file `.env`.
- Le copie di sicurezza sono a carico tuo: per esempio Hyper Backup verso un disco esterno o un cloud.
- È una procedura tecnica: conviene farla fare una volta da un tecnico.

## Sicurezza: solo tu puoi entrare
- Il gestionale non ha la pagina di registrazione: entra solo l'account che esiste già.
- Nel pannello di Supabase, alla voce Authentication → Sign In / Providers, **disattiva "Allow new users to sign up"**.
- Usa una password lunga per l'accesso al gestionale, una per il database e una per il NAS, tutte diverse tra loro.
- Attiva la verifica in due passaggi sul NAS e sull'account Supabase.

## Cosa puoi cambiare da solo (Parametri)
- **Regole e testi del gestionale:**
  - aliquote, coefficiente, cassa, acconti e maternità;
  - date delle scadenze;
  - testi, piè di pagina, firma, condizioni e logo dei PDF dei preventivi;
  - giorni per le pratiche ferme e per gli avvisi delle spese;
  - nome, logo e colore della barra laterale.
- **Le altre sezioni di Parametri:** prestazioni professionali, tipi di incarico e di pratica, stati, categorie dell'agenda, committenti e dati dello studio.
