# Integrazione Emergent e controllo sicurezza

**Obiettivo:** integrare le funzionalità dello ZIP nel progetto React/Supabase attuale.
**Architettura:** conservare struttura e ambiente locali; integrare frontend, risorse e SQL, adattando configurazioni specifiche di Emergent. Backend FastAPI di esempio non usato dal gestionale, log, screenshot e backup con dati personali restano nello ZIP e nella copia temporanea.
**Vincoli:** italiano, nessun nuovo test (AGENTS.md), nessuna modifica al database remoto, nessuna cancellazione di dati o sostituzione di .env. Conservare la correzione locale dei modali in Varie.tsx.

- [x] Confrontare archivio e checkout; salvare una copia dei file prima delle modifiche.
- [x] Integrare src/, public/, package.json, add_mail2.sql; conservare Vite locale e lockfile, aggiornando le dipendenze PDF.
- [x] Ricostruire migrazioni mancanti per preventivi, prestazioni, impostazioni, committenti nascosti, tipi incarico e nuovi campi agenda/spese/stato.
- [x] Controllare autorizzazioni, filtri utente, esportazione backup, cache tra account, input e credenziali; correggere i problemi concreti.
- [x] Verificare TypeScript applicazione/configurazione, build, lint e audit dipendenze; scrivere esiti e limiti riproducibili.

**Rollback:** ripristinare i soli file sostituiti dalla copia temporanea indicata nel rapporto; rimuovere i soli file nuovi elencati nell'inventario, senza toccare altre modifiche. Le migrazioni additive non vengono applicate da questa sessione.

**Punti di revisione:** letture/scritture tra utenti; accesso ai record dai link di ricerca; backup oltre 1000 righe; assenza delle nuove tabelle nel DB attuale; conservazione della configurazione locale e dei modali.
