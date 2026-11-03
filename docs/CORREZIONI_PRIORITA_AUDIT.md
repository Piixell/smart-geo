# Correzioni delle priorità dell'audit — 3 novembre 2026

## Attivazione

1. Conservare un backup PostgreSQL completo dello schema e dei dati attuali.
2. Verificare la precedente migrazione `202611030001_integrazione_emergent.sql`.
3. Applicare `supabase/migrations/202611030002_correzioni_preventivi.sql` al progetto Supabase corretto.
4. Aggiornare il frontend e ricaricare le schede aperte prima di creare o duplicare documenti.

Il database remoto non è stato modificato durante questa correzione. Il frontend aggiornato richiede la nuova migrazione: non elimina campi dal payload per nascondere uno schema non aggiornato.

## Preventivi

La migrazione aggiunge `note` se assente, preserva le note esistenti e trasforma solo i NULL in stringhe vuote. Aggiunge inoltre `parametri_calcolo`: versione del calcolo, anno, percentuali di cassa, coefficiente e aliquota, con indicazione dell'origine.

Un nuovo preventivo conserva le percentuali usate per il suo calcolo. La data scelta per un nuovo documento determina l'aliquota iniziale; la duplicazione usa i parametri correnti del nuovo documento. Lista, modulo, PDF e dashboard usano le percentuali salvate. Modificare le impostazioni o passare a un nuovo anno non cambia gli importi di un preventivo già salvato.

Le modifiche esplicite alle voci, alle spese, al bollo o allo sconto ricalcolano il totale con le percentuali conservate. Anche una modifica della data di un documento già salvato mantiene i parametri fiscali originali; per usare quelli correnti occorre creare un nuovo documento o duplicarlo. Il trigger conserva questi parametri nelle successive scritture e compila quelli mancanti anche quando scrive un vecchio frontend.

Per i documenti preesistenti i parametri originali non erano memorizzati: non è possibile ricavare con certezza l'importo originario da questi dati. La migrazione ricostruisce una sola volta le percentuali dalla data del documento e dalle impostazioni disponibili del proprietario, usando i valori predefiniti per le impostazioni assenti/non valide. Non modifica voci, spese, bolli o sconti. Il modulo segnala i documenti ricostruiti, da confrontare con eventuali PDF originali. Le esecuzioni successive non sostituiscono i parametri già registrati.

## Dati completi

Le fatture, gli anni disponibili e tutte le sorgenti della dashboard vengono lette con pagine ordinate e conteggio esatto iniziale. La pagina successiva parte dalla quantità effettivamente ricevuta, quindi funziona anche quando il limite API è inferiore a 1.000 righe. Non c'è un tetto complessivo fisso di 1.000 o 10.000 record.

I totali mensili e annuali sono calcolati solo dopo aver ottenuto tutte le pagine. Una pagina fallita o una risposta vuota prima del totale atteso interrompe il caricamento e mostra un errore. Dashboard e avvisi spese non trasformano tali errori in indicatori a zero. Filtri applicati e totalizzatori contabili rimangono allineati; Reset ricarica anche quando si è già alla prima pagina. Le risposte contabili obsolete non sovrascrivono quelle più recenti.

Queste letture non sono uno snapshot transazionale: modifiche concorrenti possono richiedere un nuovo caricamento. L'ordinamento stabile e il controllo del conteggio evitano il problema del limite API, senza promettere una fotografia atomica di tutte le tabelle.

## Ripristino applicativo

La migrazione è additiva e transazionale. Non rimuovere `note`, `parametri_calcolo` o i dati per ripristinare una versione del frontend. Un vecchio frontend può ignorare i parametri salvati e ripresentare il difetto nelle ristampe: usare la versione corretta per produrre documenti con gli importi conservati. Non è previsto un rollback distruttivo dello schema.

## Verifica

Nessun framework o file di test aggiunto, come richiesto da AGENTS.md. Verifiche effettuate:

- `npm run build`: superato, compresi i controlli TypeScript di applicazione e configurazione. Restano gli avvisi preesistenti sulle dimensioni del bundle e sulle annotazioni di alcune dipendenze.
- Verifica SQL su PostgreSQL in memoria con dati e identità fittizi: prima applicazione e riesecuzione riuscite; note preesistenti, parametri già salvati e percentuali zero conservati; impostazioni non valide gestite con i valori predefiniti; origine NULL rifiutata; inserimento con ruolo authenticated riuscito. Si tratta di uno schema locale rappresentativo, non della verifica del database remoto.
- Verifica diretta dei calcoli in memoria: il documento 2026 da 1.089 € rimane a 1.089 € dopo il cambio dei parametri. Un nuovo documento 2027 usa le nuove percentuali.
- Verifica diretta della lettura paginata: ottenute tutte le 1.001 righe con risposte limitate a 500; un errore o una pagina vuota anticipata interrompono la lettura senza restituire un totale parziale.
- Lint dei nove file TypeScript/React interessati: zero errori e due avvisi preesistenti. Lint complessivo: 30 errori e 26 avvisi, rispetto ai 31 errori e 27 avvisi iniziali; gli altri rilievi del repository non sono stati corretti in questo intervento.
- Revisione indipendente del diff: corretti il ricaricamento con filtri obsoleti dopo mutazioni lente e la visualizzazione dei totali durante il caricamento. Nessun rilievo importante residuo nella verifica delle due correzioni.
