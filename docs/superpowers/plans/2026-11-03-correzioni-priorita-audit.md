# Correzioni delle tre priorità dell'audit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Rendere salvabili i preventivi sullo schema versionato, conservarne i parametri fiscali e leggere integralmente contabilità e dashboard.

**Architecture:** Migrazione additiva con note e parametri di calcolo per documento, conservati anche nelle modifiche. Le letture complete passano da un helper paginato con conteggio esatto e ordinamento stabile. Le schermate distinguono errore da assenza di dati.

**Tech Stack:** React, TypeScript, Supabase/PostgreSQL, Vite; nessuna nuova dipendenza.

**Spec:** Richiesta dell'utente successiva all'audit globale del 3 novembre 2026: correzione delle tre priorità, già autorizzata.

## Global Constraints

- Non scrivere test o introdurre un framework di test, come richiesto da AGENTS.md.
- Conservare la modifica grafica concorrente già presente in PreventivoForm.tsx.
- Query e scritture delimitate per utente; nessuna operazione sul database remoto.
- Non cancellare né attribuire arbitrariamente documenti o dati esistenti.
- I parametri originali mai salvati non sono recuperabili: ricostruire una sola volta quelli disponibili, indicandone l'origine.
- Nessun commit o pubblicazione richiesto.

## Review Focus

- Documento salvato nel 2026 e ristampato dopo cambio anno/configurazione: stesso importo.
- Duplicazione: nuovo documento con parametri correnti, senza ereditare quelli storici.
- Limite API inferiore alla dimensione richiesta: continuare dalla quantità effettivamente ricevuta.
- Errore in una pagina successiva: nessun totale parziale presentato come completo.
- Filtri e richieste sovrapposte: righe e totali riferiti agli stessi filtri applicati.

## Task 1: Schema e parametri dei preventivi

- [x] Aggiungere migrazione successiva alla 202611030001 con note e parametri_calcolo, controlli di formato e trigger per conservare i parametri esistenti.
- [x] Ricostruire solo i parametri mancanti, usando data del documento e impostazioni dell'utente; marcare l'origine ricostruita.
- [x] Aggiornare tipo, calcolo, modulo, duplicazione, PDF e lettura dashboard; conservare i parametri anche nelle modifiche.
- [x] Documentare attivazione e rollback applicativo senza rimuovere colonne/dati.

## Task 2: Letture complete e gestione errori

- [x] Creare src/services/letture.ts con leggiTutteLeRighe e factory delle pagine; richiedere conteggio esatto iniziale e rifiutare letture incomplete.
- [x] Applicare a fatture, anni disponibili, lettura dei numeri fattura e alle sei sorgenti dashboard, inclusi gli avvisi spese.
- [x] Conservare ordinamento e totalizzatori attuali; gestire filtri applicati, reset, risposte obsolete e messaggi di errore.

## Task 3: Verifica e revisione

- [x] Eseguire typecheck e build; distinguere gli eventuali limiti dell'ambiente dai difetti del progetto.
- [x] Eseguire lint, confrontando il risultato iniziale (31 errori, 27 warning) e controllare separatamente i file aggiunti/modificati.
- [x] Far rileggere il diff a un revisore indipendente e correggere gli eventuali difetti importanti.
- [x] Riferire modifiche, verifiche e migrazione ancora da applicare al database remoto.

## Stato iniziale e decisioni

- Typecheck eseguito come prima parte di npm run build: nessun errore; bundling Vite bloccato da accesso negato durante lettura dei percorsi superiori.
- Lint iniziale: 31 errori, 27 warning.
- Esecuzione nello spazio di lavoro corrente per preservare le modifiche già presenti e rendere il risultato direttamente verificabile dall'utente.
- Per i preventivi nuovi si consolidano le percentuali usate dal calcolo; per i vecchi non si inventano totali originali non disponibili.


## Esito dell'esecuzione

- Build finale superata; include i due progetti TypeScript. Il limite di accesso iniziale di Vite è stato risolto eseguendo la verifica con l'accesso autorizzato.
- Lint completo: 30 errori, 26 warning. Nei nove file TypeScript/React interessati: zero errori, due warning già presenti.
- Migrazione eseguita in PostgreSQL in memoria, anche su schema con note/parametri già esistenti: idempotenza, conservazione note e parametri, valori zero, fallback di impostazioni non valide e inserimento authenticated verificati.
- Verifiche dirette in memoria dei calcoli e della paginazione, senza file di test nel progetto: storico 1.089 → 1.089, nuovo documento con percentuali correnti, 1.001 righe lette con limite 500, errori/letture interrotte propagati.
- Revisore indipendente: due rilievi importanti di concorrenza/presentazione corretti e ricontrollati. I ricaricamenti post-mutazione usano ora lo stato corrente e il footer è nascosto durante il caricamento.
- Ruling: lettura completa paginata con aggregazione nel client — preserva gli ordinamenti numerici e i totalizzatori mensili esistenti, senza aggiungere RPC o dipendenze all'applicazione. Non promette uno snapshot atomico fra tabelle.
- Database remoto non modificato. La migrazione 202611030002 deve essere applicata prima di attivare il frontend aggiornato; dettagli in docs/CORREZIONI_PRIORITA_AUDIT.md.
