# Smart-Geo Design System — "Datum" v2

Un sistema di design originale per **Smart-Geo**, applicazione web intelligente per **studi di geometri**. Smart-Geo gestisce il ciclo completo di una pratica professionale: pratiche comunali e catastali (*Comune e Catasto*), attestati energetici (*APE*), pratiche varie (*Varie*), contabilità e fatturazione (*Contabilità*), planner settimanale, rubrica contatti (*Rubrica*) e gestione scadenze. Il prodotto e i suoi testi sono in **italiano**.

> **Questa è un'identità visiva NUOVA e originale**, creata su richiesta. Intenzionalmente **non** riproduce l'attuale look di produzione (un tema blu generico shadcn/Tailwind). Introduce invece **"Datum"** — un'estetica di strumenti di precisione tratta dalla rilevazione e cartografia, con focus sull'**usabilità** e l'**efficienza operativa**.

## Sources
Questo sistema è stato informato dal codebase reale del prodotto (struttura, dominio, feature set, copy italiano), **non** dal suo styling attuale:
- **GitHub — [Piixell/smart-geo](https://github.com/Piixell/smart-geo)** (React + TypeScript + Vite + Supabase). Esplora questo repo per capire le schermate reali dell'app (Dashboard, Comune e Catasto, APE, Varie, Contabilità, Rubrica, Planner, Parametri), il modello di dati e la terminologia italiana quando costruisci nuovi design Smart-Geo.

Solo dominio, inventario delle feature e terminologia sono stati portati avanti. Tutti i colori, tipografia, spaziature, motivi e componenti qui sotto sono originali.

---

## Design Principles

Il sistema "Datum" v2 si fonda su tre principi guida:

### Misura Precisa
Ogni elemento visivo ha uno scopo funzionale. I dati misurati (coordinate, importi, date, ID) sono sempre renderizzati in monospace per garantire leggibilità e precisione. Niente decorazione fine a se stessa — ogni pixel è un punto di riferimento.

### Azione Rapida
L'utente professionista lavora tutto il giorno con questo strumento. Ogni flusso deve richiedere il minimo numero di click possibili. Shortcut globali, menu contestuali e quick actions riducono la distanza tra intenzione e azione.

### Feedback Chiaro
Ogni azione dell'utente riceve un riscontro immediato e inequivocabile. Salvataggio completato, errore rilevato, operazione in corso — lo stato del sistema è sempre trasparente.

---

## CONTENT FUNDAMENTALS

### Lingua e Lessico
- **Lingua:** italiano, ovunque. Vocabolario di dominio: *pratica* (file/case), *committente* (client), *catasto* (land registry), *APE* (energy certificate), *scadenza* (deadline), *fatturato* (revenue), *rubrica* (address book).
- **Voce:** professionale, concisa e funzionale — uno strumento che si rivolge a un professionista impegnato. Preferisce imperativi diretti e frasi nominali brevi: "Nuova pratica", "Salva contatto", "Solo attivi", "Panoramica dello studio".
- **Persona:** si rivolge all'utente implicitamente ("Bentornato nello studio") ma per lo più etichetta oggetti e azioni piuttosto che narrare. La seconda persona è usata sparsamente e con calore in momenti come il login.

### Casing
- **Sentence case** per body, labels e bottoni ("Nuovo contatto", non "Nuovo Contatto")
- **UPPERCASE** riservato per micro-labels: etichette campi, intestazioni tabelle, caption KPI — sempre con letter-spacing ampio e tonalità ink smorzata

### Formattazione Dati
- Italiana: `€ 2.450,00`, date come `04/07/2026`, coordinate come `45.4642, 9.1900`
- Tutte le cifre renderizzate in **monospace**

### Emoji
- Nessuna. Questo è uno strumento professionale; l'iconografia trasmette significato al posto delle emoji.

### Micro-Copy
- **Azioni:** verbi diretti e concisi — "Cerca", "Filtra", "Salva", "Annulla", "Conferma"
- **Stati vuoti:** messaggi utili con CTA — "Nessuna pratica trovata. Crea la prima pratica."
- **Errori:** descrittivi ma brevi — "Errore nel salvataggio. Riprova."
- **Numeri:** formati italiani con separatore migliaia e decimale — `1.234`, `€ 12.500,00`

### Esempi di Tone
- "Aggiornato · 04/07/2026"
- "Scaduta da 2 giorni"
- "18 pratiche comune aperte"
- "Gestione contatti · 6 risultati"
- "Salvato con successo"
- "Pratica eliminata"

---

## VISUAL FOUNDATIONS

### Colori

#### Palette Primaria — Ink Neutrals
Tonalità di grigio-verde per la base dell'interfaccia. Da `--ink-50` (canvas da disegno) a `--ink-900` (testo e chrome sidebar).

| Token | Valore | Uso |
|-------|--------|-----|
| `--ink-50` | `#FAFAF9` | Canvas principale, sfondo pagine |
| `--ink-100` | `#F5F5F4` | Sfondo card, header tabelle |
| `--ink-200` | `#E7E5E4` | Bordi default, divider |
| `--ink-300` | `#D6D3D1` | Bordi forti, input border |
| `--ink-400` | `#A8A29E` | Testo smorzato, placeholder |
| `--ink-500` | `#78716C` | Testo secondario |
| `--ink-600` | `#57534E` | Testo primario |
| `--ink-700` | `#44403C` | Testo heading |
| `--ink-800` | `#292524` | Sidebar bg |
| `--ink-900` | `#1C1917` | Sidebar chrome, text su fondi scuri |

#### Colore Brand — Signal Orange
Unico colore di azione primaria. Usato per: azione principale per vista, nav item attivo, CTA.

| Token | Valore | Uso |
|-------|--------|-----|
| `--signal-500` | `#EA580C` | Primary action, nav active |
| `--signal-600` | `#C2410C` | Hover primary, links |
| `--signal-700` | `#9A3412` | Press primary |

#### Colore Secondario — Topographic Teal
Per stati positivi/completati, "pagato", data visualization.

| Token | Valore | Uso |
|-------|--------|-----|
| `--topo-500` | `#0F766E` | Success, completato, pagato |
| `--topo-600` | `#0D9488` | Hover success |
| `--topo-700` | `#0F766E` | Press success |

#### Colori Feedback
4 colori semantici per feedback immediato:

| Token | Valore | Uso |
|-------|--------|-----|
| `--success-500` | `#0F766E` | Salvataggio, operazione completata |
| `--error-500` | `#DC2626` | Errori, eliminazioni, stato annullato |
| `--warning-500` | `#D97706` | Attenzione, scadenze imminenti |
| `--info-500` | `#2563EB` | Informazioni, stati in attesa |

#### Mappatura Stati Pratica
Lo stato di una pratica si mappa su tonalità specifiche:

| Stato | Colore | Token |
|-------|--------|-------|
| In lavorazione | Signal orange | `--signal-500` |
| Completato | Teal | `--topo-500` |
| In attesa | Warning amber | `--warning-500` |
| Annullato | Error red | `--error-500` |
| Bozza | Neutral ink | `--ink-400` |

### Tipografia

#### Font Families
3 famiglie con ruoli distinti:

| Font | Ruolo | Uso |
|------|-------|-----|
| **Space Grotesk** | Display | Titoli pagina, card title, wordmark |
| **IBM Plex Sans** | Body | Testo UI, labels, body, navigazione |
| **IBM Plex Mono** | Data | Coordinate, importi, date, ID, protocolli |

#### Regola Fondamentale
**Ogni valore misurato, quantificato o identificativo viene renderizzato in IBM Plex Mono.** Questa è la signature del sistema — il mono-for-data è il tratto distintivo di "Datum".

#### Gerarchia Tipo

| Elemento | Font | Weight | Size | Letter-spacing |
|----------|------|--------|------|----------------|
| H1 Pagina | Space Grotesk | 700 | 28px | -0.02em |
| H2 Sezione | Space Grotesk | 600 | 22px | -0.02em |
| H3 Card title | Space Grotesk | 600 | 18px | -0.01em |
| Body | IBM Plex Sans | 400 | 14px | 0 |
| Body bold | IBM Plex Sans | 600 | 14px | 0 |
| Label | IBM Plex Sans | 500 | 12px | 0.02em |
| Micro label (UPPERCASE) | IBM Plex Sans | 500 | 11px | 0.08em |
| Mono data | IBM Plex Mono | 400 | 14px | 0 |
| Mono data bold | IBM Plex Mono | 600 | 14px | 0 |
| Mono small | IBM Plex Mono | 400 | 12px | 0 |

### Spacing

Base: **4px**. Tutte le dimensioni sono multipli di 4.

| Token | Valore | Uso |
|-------|--------|-----|
| `--space-1` | 4px | Gap icone inline, padding micro |
| `--space-2` | 8px | Padding sm (bottoni, badge) |
| `--space-3` | 12px | Padding md (input, card compact) |
| `--space-4` | 16px | Padding card default, gap grid |
| `--space-5` | 20px | Gap sezioni contigue |
| `--space-6` | 24px | Padding pagina, gap section |
| `--space-8` | 32px | Margin sezioni major |

### Bordi

| Token | Valore | Uso |
|-------|--------|-----|
| `--border-hair` | `--ink-100` | Divider interni, separatori |
| `--border-default` | `--ink-200` | Bordi card, bordi tabella |
| `--border-strong` | `--ink-400` | Bordi input focus, bordi attivi |

### Ombre

Ridotte e quasi piatte — il sistema privilegia bordi e bordi colorati per separazione.

| Token | Valore | Uso |
|-------|--------|-----|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Card a riposo |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Card hover, dropdown |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modali, overlay |

### Border Radius

Piccoli e strumentali — niente arrotondamenti marcati.

| Token | Valore | Uso |
|-------|--------|-----|
| `--radius-sm` | 4px | Badge, tag |
| `--radius-md` | 6px | Bottoni, input |
| `--radius-lg` | 8px | Card, modali |
| `--radius-full` | 9999px | Pills di stato |

### Sfondi

- **Canvas:** drafting-paper `--ink-50`
- **Grid texture:** rete cartografica sottile a 22px (`--grid-fine`), `--grid-on-ink` per dark chrome
- **Hero/Login:** anelli concentrici di contour in signal orange
- **Nessuna fotografia, nessuna gradiente decorativa, nessuna illustrazione**

### Dark Mode

Il sistema supporta la **modalità scura** tramite toggle manuale (Zustand store + localStorage).

#### Strategia
La gestione si basa su **inversione della scala ink** tramite CSS custom properties:
- In light mode: `--ink-50` (#FAFAF9) è il canvas, `--ink-900` (#1C1917) è il testo
- In dark mode: `--ink-50` (#1C1917) diventa il canvas, `--ink-900` (#000000) è il chrome sidebar

Questo approccio garantisce che **tutti i token `ink-*`** funzionino automaticamente in entrambe le modalità senza duplicare le classi Tailwind.

#### Palette Dark Mode

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--ink-50` | `#FAFAF9` | `#1C1917` | Canvas pagina |
| `--ink-100` | `#F5F5F4` | `#292524` | Card, sfondi superfici |
| `--ink-200` | `#E7E5E4` | `#44403C` | Bordi default |
| `--ink-300` | `#D6D3D1` | `#57534E` | Bordi forti, input |
| `--ink-400` | `#A8A29E` | `#A8A29E` | Testo smorzato (invariato) |
| `--ink-500` | `#78716C` | `#D6D3D1` | Testo secondario |
| `--ink-600` | `#57534E` | `#E7E5E4` | Testo primario |
| `--ink-700` | `#44403C` | `#F5F5F4` | Testo heading |
| `--ink-800` | `#292524` | `#0C0A09` | Sidebar bg |
| `--ink-900` | `#1C1917` | `#000000` | Chrome sidebar |

#### Colori Brand in Dark Mode

I colori brand (signal, topo, feedback) **restano invariati** — solo le varianti bg (50, 100, 200) si adattano per essere leggibili su sfondi scuri:

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `--signal-50` | `#FFF7ED` | `#431407` | Badge signal scuro |
| `--signal-100` | `#FFEDD5` | `#7C2D12` | Badge signal scuro |
| `--topo-50` | `#F0FDFA` | `#134E4A` | Badge topo scuro |
| `--success-50` | `#F0FDFA` | `#134E4A` | Badge success scuro |
| `--error-50` | `#FEF2F2` | `#450A0A` | Badge error scuro |
| `--warning-50` | `#FFFBEB` | `#451A03` | Badge warning scuro |
| `--info-50` | `#EFF6FF` | `#1E3A5F` | Badge info scuro |

#### Comportamento Sidebar
La sidebar mantiene un chrome scuro in entrambe le modalità, ma in dark mode diventa **ancora più profonda** (`--ink-900` → `#000000`).

#### Focus Ring
L'anello di focus adatta l'anello interno: `--focus-ring-offset` usa `--ink-50` in light e `--ink-100` in dark per restare visibile.

#### Implementazione Tecnica

Tailwind compila le utility `bg-ink-50`, `text-ink-700` ecc. in **valori statici** (`#FAFAF9`, `#44403C`) al build time — non usa `var(--ink-50)`. Di conseguenza, l'inversione delle CSS variable nel blocco `.dark` **non ha effetto** sulle utility Tailwind.

Per risolvere, `index.css` contiene un **override globale** (dopo `@tailwind utilities`) che forz ogni utility a usare la CSS variable in dark mode:

```css
.dark .bg-ink-50  { background-color: var(--ink-50)  !important; }
.dark .bg-ink-100 { background-color: var(--ink-100) !important; }
.dark .text-ink-700 { color: var(--ink-700) !important; }
.dark .border-ink-200 { border-color: var(--ink-200) !important; }
```

Inoltre, le **component classes** (`.card`, `.modal`, `.toast`, `.context-menu`, ecc.) definite con `@apply` in `index.css` ricevono un override dedicato:

```css
.dark .card,
.dark .modal,
.dark .toast,
.dark .context-menu,
.dark .command-palette-content { ... }
```

**Regole per sviluppatori:**

1. **Non usare `dark:` variant inline** — il sistema funziona via CSS variable inversion; le `dark:` inline compilano in valori statici e confliggono con l'override globale
2. Usare sempre token `ink-*`, `signal-*`, `topo-*` invece di `gray-*`, `blue-*`, `green-*` generici
3. `bg-white` viene automaticamente convertito in `var(--ink-100)` in dark mode dall'override globale
4. I colori brand 500+ (`signal-500`, `topo-500`, ecc.) **non cambiano** in dark mode
5. Solo le varianti bg 50/100/200 si adattano per leggibilità su sfondi scuri
6. Le component classes (`.card`, `.input`, `.modal`, ecc.) non devono avere `@apply dark:*` — l'override globale le gestisce

### Animazioni

Minimali e rapide — 120–150ms ease transitions su hover/press.

| Azione | Animazione | Duration |
|--------|-----------|----------|
| Card hover | `translateY(-2px)` + shadow-md | 150ms ease |
| Button press | `translateY(1px)` | 100ms ease |
| Modal enter | `scale(0.95→1)` + fade | 200ms ease-out |
| Toast enter | `translateX(100%→0)` | 150ms ease-out |
| Toast exit | `opacity 1→0` | 100ms ease-in |
| Page transition | fade-in | 150ms ease-out |

Niente bounce, niente loop infiniti.

### Hover e Press States

- **Hover superfici:** elevation sm→md, bordo leggermente più forte
- **Hover nav items:** testo bianco su overlay bianco semi-trasparente
- **Hover links:** `--signal-600`
- **Press buttons:** translate down 1px, nessuna scala

---

## LAYOUT SYSTEM

### Struttura Generale

```
┌─────────────────────────────────────────────────────┐
│                    TOP BAR (48px)                    │
│  [Breadcrumb]    [Cmd+K Ricerca]   [Notifiche][Avatar] │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │           CONTENT AREA                   │
│ (240px)  │        (max-width: 1200px)               │
│          │                                          │
│ Nav      │    Scrollable, padded 24px               │
│ princip. │    su sfondo grid texture                │
│          │                                          │
│ Strumenti│                                          │
│          │                                          │
│ Impost.  │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

### Sidebar (240px)

Sidebar fissa a profondità **240px** con chrome scuro `--ink-800`.

#### Struttura
```
┌──────────────────┐
│  ▲ SMART-GEO     │  Wordmark + mark
│    wordmark      │
├──────────────────┤
│ NAVIGAZIONE      │  Micro-label uppercase
│ ● Dashboard      │  Active: signal left border
│   Planner        │
│   Comune/Catasto │
│   APE            │
│   Varie          │
├──────────────────┤
│ STRUMENTI        │
│   Contabilità    │
│   Fatture        │
│   Spese          │
│   Rubrica        │
├──────────────────┤
│ IMPOSTAZIONI     │
│   Parametri      │
│   Impostazioni   │
└──────────────────┘
```

#### Comportamento
- **Desktop (>1024px):** espanso con label completi
- **Tablet (640-1024px):** icon-only con tooltip hover
- **Mobile (<640px):** collassata, accessibile tramite hamburger menu
- **Active state:** left border 3px signal orange + bg `rgba(255,255,255,0.05)`
- **Hover:** bg `rgba(255,255,255,0.03)`

### Top Bar (48px)

Top bar fissa a **48px** con sfondo bianco e bordo inferiore `--ink-200`.

#### Contenuto
- **Left:** Breadcrumb (Home > Sezione)
- **Center/Right:** Ricerca globale (Cmd+K)
- **Right:** Icona notifiche (bell) + Avatar utente

Nessun titolo di pagina duplicato — il titolo è nella content area.

### Content Area

- **Max-width:** 1200px centrato
- **Padding:** 24px su tutti i lati
- **Background:** `--ink-50` con grid texture sottile
- **Scroll:** verticale, indipendente dalla sidebar

#### Grid Responsive
- **Mobile (<640px):** 1 colonna, full-width
- **Tablet (640-1024px):** 2 colonne, gap 16px
- **Desktop (>1024px):** 3 colonne, gap 24px

---

## DASHBOARD MINIMALISTA

La dashboard è il punto di ingresso principale. Deve essere **immediata** e **funzionale** — niente rumore, solo ciò che serve per iniziare la giornata.

### Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Bentornato, [Nome]                    [Data oggi]  │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌───────────────┐ ┌───────────────┐ ┌────────────┐│
│  │ PRATICHE APERTE│ │SCADENZE 7GG  │ │FATT. MESE  ││
│  │      18       │ │      3        │ │ €12.500    ││
│  │  +2 vs mese p.│ │  ▲ 1 urgente  │ │ +15% vs p. ││
│  └───────────────┘ └───────────────┘ └────────────┘│
│                                                     │
├─────────────────────────────────────────────────────┤
│  AZIONI RAPIDE                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ + Nuova  │ │ + Nuovo  │ │ + Registra│ │ Planner││
│  │ Pratica  │ │ Contatto │ │ Fattura  │ │  Apri  ││
│  │  Cmd+N   │ │ Cmd+Sh+N │ │          │ │        ││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
├─────────────────────────────────────────────────────┤
│  ATTIVITÀ RECENTI                                   │
│  • Modificata pratica #1234 — Comune e Catasto      │
│  • Nuovo contatto: Mario Rossi — Geometra           │
│  • Fattura #F2024-045 registrata — €1.250,00        │
│  • Scadenza APE #89 in scadenza — 2 giorni          │
│  • Pratica #567 completata — Voltura catastale      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3 KPI Essenziali

| KPI | Valore | Dettaglio | Colore |
|-----|--------|-----------|--------|
| **Pratiche Aperte** | Numero totale | Variazione vs mese precedente (+/-) | Signal orange |
| **Scadenze 7gg** | Numero scadenze prossime | Badge "urgente" se >0 con deadline <3gg | Warning amber |
| **Fatturato Mese** | € importo | Percentuale variazione vs mese precedente | Teal |

#### Regole KPI
- Il valore è sempre in **IBM Plex Mono bold**
- La variazione è in **IBM Plex Sans** con freccia ↑↓
- Positivo = teal, Negativo = signal-600, Neutro = ink-400
- Click sul KPI naviga alla sezione dettagliata

### Quick Actions Grid

4 pulsanti grandi e cliccabili, disposti in griglia 2x2 o 4x1.

| Azione | Icona | Shortcut | Naviga a |
|--------|-------|----------|----------|
| Nuova Pratica | `plus-circle` | Cmd+N | Modale nuova pratica |
| Nuovo Contatto | `user-plus` | Cmd+Shift+N | Modale nuovo contatto |
| Registra Fattura | `file-plus` | — | /contabilita (nuova fattura) |
| Apri Planner | `calendar` | — | /planner |

#### Stile Quick Action
- Card bianca, bordo `--ink-200`, padding 16px
- Icona grande (24px) in chip signal-500
- Label in IBM Plex Sans 14px bold
- Shortcut hint in IBM Plex Mono 11px `--ink-400`
- Hover: lift -2px + shadow-md

### Attività Recenti

Lista delle ultime 5 operazioni con:

| Elemento | Formato |
|----------|---------|
| Icona tipo | Pratica/Contatto/Fattura/Scadenza |
| Descrizione | "Modificata pratica #1234" |
| Sottotitolo | Categoria o committente |
| Timestamp | relativo: "2 ore fa", "ieri" |

- Click sull'elemento naviga all'oggetto
- Badge colore per tipo (signal=topo/info/warning)
- Max 5 elementi, link "Vedi tutte" per storia completa

---

## SISTEMA SHORTCUT

### Ricerca Universale (Cmd+K / Ctrl+K)

Modal full-screen per ricerca istantanea in tutta l'app.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ 🔍 Cerca pratiche, contatti, fatture...     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  PRATICHE                                           │
│  ┌─────────────────────────────────────────────┐   │
│  │ 📁 Pratica #1234 — Mario Rossi — In lavor. │   │
│  │ 📁 Pratica #1235 — Luigi Bianchi — Complet.│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  CONTATTI                                           │
│  ┌─────────────────────────────────────────────┐   │
│  │ 👤 Mario Rossi — Geometra — 333-1234567     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  AZIONI                                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ ➕ Nuova pratica                    Cmd+N   │   │
│  │ 👤 Nuovo contatto               Cmd+Shift+N│   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ↑↓ naviga  •  Enter seleziona  •  Esc chiudi     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Comportamento
- **Apertura:** Cmd+K (Mac) o Ctrl+K (Windows/Linux)
- **Chiusura:** Esc, click fuori, selezione risultato
- **Input:** autofocus, placeholder contestuale
- **Ricerca:** real-time, min 2 caratteri, debounce 150ms
- **Risultati:** raggruppati per categoria, max 5 per categoria
- **Navigazione:** freccia ↑↓, Enter per selezionare
- **Backdrop:** ink-900 @ 60% + blur 4px

#### Categorie Ricerca
1. **Pratiche** — numero, committente, stato
2. **Contatti** — nominativo, telefono, email
3. **Fatture** — numero, committente, importo
4. **Azioni** — azioni rapide disponibili

#### Stile Risultati
- Hover: bg `--ink-100`
- Selected: bg `--signal-500` @ 10%, border-left signal
- Icona tipo a sinistra
- Titolo in IBM Plex Sans bold
- Sottotitolo in IBM Plex Sans regular `--ink-500`
- Shortcut a destra in IBM Plex Mono `--ink-400`

### Menu Contestuale (Right-click)

Menu rapido attivato con click destro su card, tabelle e liste.

#### Trigger Elementi
- **Card pratica:** Modifica, Duplica, Archivia, Elimina
- **Riga tabella pratica:** Modifica, Visualizza, Duplica, Elimina
- **Contatto:** Chiama, Invia email, Modifica, Elimina
- **Fattura:** Visualizza, Scarica PDF, Registra pagamento, Elimina
- **Task planner:** Modifica, Sposta, Elimina

#### Layout Menu
```
┌──────────────────┐
│ ✏️  Modifica      │
│ 📋 Duplica        │
│ ─────────────────│
│ 📦 Archivia       │
│ 🗑️  Elimina       │
└──────────────────┘
```

#### Comportamento
- **Apertura:** right-click o long-press (mobile)
- **Posizionamento:** intelligente rispetto ai bordi viewport
- **Chiusura:** click fuori, Esc, selezione voce
- **Animazione:** fade-in 100ms
- **Larghezza:** min 180px, max 240px

#### Stile Menu
- Sfondo bianco, bordo `--ink-200`, shadow-md
- Voci: padding 8px 12px, icona 16px + label
- Hover: bg `--ink-100`
- Separatore: 1px `--ink-200` tra gruppi
- DANGER zone (Elimina): testo `--error-500`, hover bg `--error-500` @ 10%

#### Shortcut Tastiera Globali

| Shortcut | Azione |
|----------|--------|
| `Cmd/Ctrl + K` | Apri ricerca universale |
| `Cmd/Ctrl + N` | Nuova pratica |
| `Cmd/Ctrl + Shift + N` | Nuovo contatto |
| `Cmd/Ctrl + S` | Salva (in modali/form) |
| `Escape` | Chiudi modali/menu/ricerca |
| `1-9` | Navigazione rapida sezioni (configurabile) |

---

## SISTEMA FEEDBACK

### Toast Notifications

Notifiche temporanee per feedback immediato.

#### Tipi Toast

| Tipo | Icona | Colore | Durata | Uso |
|------|-------|--------|--------|-----|
| Success | `check-circle` | `--topo-500` | 3s | Salvataggio, operazione completata |
| Error | `alert-circle` | `--error-500` | 5s | Errori, fallimenti |
| Warning | `alert-triangle` | `--warning-500` | 4s | Attenzione, scadenze |
| Info | `info` | `--info-500` | 3s | Informazioni, conferme |

#### Layout Toast
```
┌─────────────────────────────────────┐
│ ✅  Pratica salvata con successo    │ ×
└─────────────────────────────────────┘
```

#### Comportamento
- **Posizione:** bottom-right (desktop), top-center (mobile)
- **Entrata:** slide-in da destra, 150ms ease-out
- **Uscita:** fade-out, 100ms ease-in
- **Max simultanei:** 3 (i più vecchi scivolano via)
- **Click:** chiude prematuramente
- **Hover:** pausa timer auto-dismiss

#### Stile Toast
- Sfondo bianco, bordo-left 4px colore tipo
- Padding 12px 16px
- Icona 20px a sinistra
- Testo IBM Plex Sans 14px
- Bottone chiusura × a destra
- Shadow-lg, border-radius 8px

### Feedback Visivo Azioni

#### Stati di Caricamento
| Stato | Feedback |
|-------|----------|
| Caricamento iniziale | Skeleton screen (linee grigie animate) |
| Salvataggio in corso | Spinner 16px + testo "Salvando..." |
| Salvataggio completato | Toast success + check icon 500ms |
| Errore salvataggio | Bordo rosso campo + toast error |
| Eliminazione in corso | Spinner + "Eliminando..." |
| Eliminazione completata | Toast success "Eliminato" |

#### Stati Interattivi

| Elemento | Hover | Press | Focus | Disabled |
|----------|-------|-------|-------|----------|
| Card | lift -2px + shadow-md | — | — | opacity 50% |
| Button primary | scurito 10% | translateY(1px) | ring signal | opacity 50% + no events |
| Button secondary | scurito 5% | translateY(1px) | ring signal | opacity 50% + no events |
| Input | — | — | border signal + ring glow | bg `--ink-100` |
| Link | color signal-600 | — | underline | — |
| Nav item | bg overlay | — | — | — |

#### Skeleton Screen
Struttura di caricamento che mantiene il layout while loading:

```
┌─────────────────────────────────────┐
│ ████████████████  ██████████        │
│ ████████████████████████████████    │
│ ████████████████████████████████    │
│ ██████████████  ████████████████    │
└─────────────────────────────────────┘
```

- Color: `--ink-100` base, `--ink-200` animato
- Animazione: shimmer left-to-right, 1.5s infinite
- Mantieni esatta dimensione del contenuto reale

---

## COMPONENTI

### Button

#### Varianti

| Variante | Sfondo | Testo | Bordo | Uso |
|----------|--------|-------|-------|-----|
| Primary (signal) | `--signal-500` | white | — | Azione principale per vista |
| Secondary (topo) | `--topo-500` | white | — | Azione positiva, "Conferma" |
| Outline | transparent | `--ink-600` | `--ink-300` | Azioni secondarie |
| Ghost | transparent | `--ink-600` | — | Azioni terziarie, annulla |
| Danger | `--error-500` | white | — | Eliminazioni, azioni distruttive |

#### Size

| Size | Altezza | Padding | Font size |
|------|---------|---------|-----------|
| sm | 32px | 8px 12px | 12px |
| md | 40px | 8px 16px | 14px |
| lg | 48px | 12px 24px | 16px |

#### Elementi

- **Icon leading:** 16px, gap 8px a destra
- **Icon trailing:** 16px, gap 8px a sinistra
- **Loading state:** spinner al posto dell'icona, testo rimane
- **Shortcut hint:** testo 11px mono sotto il label (es. "Cmd+N")

### Input

#### Struttura
```
┌─────────────────────────────────────┐
│ ETICHETTA CAMPO (sempre visibile)   │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Placeholder / valore         │ │
│ └─────────────────────────────────┘ │
│ Testo helper o messaggio errore      │
└─────────────────────────────────────┘
```

#### Varianti

| Tipo | Uso |
|------|-----|
| Text | Input testo generico |
| Number | Importi, quantità |
| Date | Date italiane (gg/mm/aaaa) |
| Search | Con icona ricerca integrata |
| Mono | Per coordinate, ID, protocolli |

#### Stati

| Stato | Bordo | Sfondo | Extra |
|-------|-------|--------|-------|
| Default | `--ink-300` | white | — |
| Focus | `--signal-500` | white | ring glow signal |
| Error | `--error-500` | `--error-500` @ 5% | messaggio errore sotto |
| Disabled | `--ink-200` | `--ink-100` | opacity 60% |

#### Elementi
- **Label:** sempre visibile, IBM Plex Sans 12px 500
- **Helper text:** IBM Plex Sans 12px `--ink-500`
- **Error text:** IBM Plex Sans 12px `--error-500`
- **Leading icon:** 16px `--ink-400`
- **Trailing action:** bottone ghost piccolo (clear, toggle visibility)

### Card

#### Varianti

| Variante | Differenza | Uso |
|----------|-----------|-----|
| Default | bordo `--ink-200`, shadow-sm | Contenuto generico |
| Accent | + top border 3px `--signal-500` | Card evidenziate, KPI |
| Flush | nessun padding, bordo solo esterno | Tabelle, liste |
| Clickable | cursor pointer, hover lift | Card navigabili |

#### Struttura
```
┌─────────────────────────────────────┐
│ Header (opzionale)         [Menu ⋮] │
│ ─────────────────────────────────── │
│ Body                               │
│                                    │
│                                    │
│ ─────────────────────────────────── │
│ Footer (opzionale)                 │
└─────────────────────────────────────┘
```

#### Header Card
- Titolo: Space Grotesk 18px 600
- Azione destra: icon button ghost (menu contestuale)

#### Hover
- lift: `translateY(-2px)`
- shadow: sm → md
- duration: 150ms ease

### Table

#### Struttura
```
┌──────────────────────────────────────────────────┐
│ #  │ COMMITTENTE    │ TIPO    │ STATO   │ AZIONI │
├──────────────────────────────────────────────────┤
│ 1  │ Mario Rossi    │ Comune  │ ● Attiva│  ⋮     │
│ 2  │ Luigi Bianchi  │ Catasto │ ● Comp. │  ⋮     │
│ 3  │ Anna Verdi     │ APE     │ ● Attesa│  ⋮     │
└──────────────────────────────────────────────────┘
```

#### Elementi

| Elemento | Stile |
|----------|-------|
| Header | sticky top, bg `--ink-100`, micro-label uppercase |
| Row hover | bg `--ink-50` |
| Row selected | bg `--signal-500` @ 5%, border-left signal |
| Sortable header | icona freccia ↑↓, click per ordinare |
| Cell data | IBM Plex Sans 14px |
| Cell mono | IBM Plex Mono 14px (per ID, importi) |
| Cell actions | icon button ghost (menu contestuale) |
| Empty state | messaggio + CTA "Crea prima pratica" |

#### Context Menu
Right-click su riga → menu contestuale con azioni specifiche.

---

## MODALI E DIALOG

### Modal Standard

#### Layout
```
┌─────────────────────────────────────────┐
│  Titolo Modal                    [ × ]  │
│  ─────────────────────────────────────  │
│                                         │
│  Contenuto principale                   │
│                                         │
│                                         │
│  ─────────────────────────────────────  │
│  [Annulla]              [Salva]         │
└─────────────────────────────────────────┘
```

#### Dimensioni

| Size | Larghezza | Uso |
|------|-----------|-----|
| sm | 400px | Conferme, input semplici |
| md | 600px | Form standard |
| lg | 800px | Form complessi, anteprime |
| full | calc(100vw - 48px) | Ricerca Cmd+K |

#### Comportamento
- **Backdrop:** ink-900 @ 45% + blur 3px
- **Entrata:** scale 0.95→1 + fade, 200ms ease-out
- **Uscita:** scale 1→0.95 + fade, 150ms ease-in
- **Chiusura:** ×, Esc, click fuori, Annulla
- **Focus trap:** tab cicla solo dentro il modale
- **Scroll:** body scrollable, footer sticky

#### Footer Modal
- **Left:** azioni secondarie (ghost button) — "Annulla"
- **Right:** azioni primarie (primary button) — "Salva", "Crea"
- Separatore: 1px `--ink-200` sopra il footer

### Confirm Dialog

Usato per azioni irreversibili (eliminazioni).

```
┌─────────────────────────────────────┐
│  ⚠️  Eliminare pratica #1234?      │
│                                     │
│  Questa azione non può essere       │
│  annullata. La pratica e tutti i    │
│  dati associati verranno rimossi.   │
│                                     │
│  [Annulla]          [Elimina]       │
└─────────────────────────────────────┘
```

- Titolo: Space Grotesk 18px, icona warning
- Body: IBM Plex Sans 14px `--ink-500`
- Bottone conferma: danger variant
- Size: sempre sm (400px)

---

## RESPONSIVE DESIGN

### Breakpoints

| Breakpoint | Range | Layout |
|------------|-------|--------|
| Mobile | < 640px | 1 colonna, sidebar collapsed |
| Tablet | 640px — 1024px | 2 colonne, sidebar icon-only |
| Desktop | > 1024px | 3 colonne, sidebar completa |

### Mobile (< 640px)

| Elemento | Adattamento |
|----------|-------------|
| Sidebar | Hamburger menu, slide-in da sinistra |
| Top bar | Ricerca + hamburger + avatar |
| Dashboard KPI | Stack verticale, 1 colonna |
| Quick actions | Stack verticale, full-width |
| Tabelle | Card layout (1 card per riga) |
| Form | Full-width, labels sopra |
| Modali | Full-screen |
| Modali conferma | Bottom sheet |
| Menu contestuale | Bottom sheet |

### Tablet (640px — 1024px)

| Elemento | Adattamento |
|----------|-------------|
| Sidebar | Icon-only, 64px larghezza |
| Top bar | Completa |
| Dashboard KPI | 3 colonne compatte |
| Quick actions | 2x2 grid |
| Tabelle | Completa, colonne ridotte |
| Form | 2 colonne |
| Modali | md width centrate |

### Desktop (> 1024px)

Layout completo come descritto nel Layout System.

---

## ICONOGRAFIA

### Libreria
- **Lucide** — la stessa icon set usata dall'app reale (`lucide-react`)
- Caricata da CDN (`unpkg.com/lucide`) e renderizzata via `<i data-lucide="name">` + `lucide.createIcons()`

### Stile
- Outline, stroke weight **1.5**, ~16–20px nell'UI
- Geometriche, coerenti, nessuna variante filled

### Size Standard

| Size | Uso |
|------|-----|
| 16px | Inline, button icon, table cell |
| 20px | Navigation, card icon, input leading |
| 24px | Section header, dashboard KPI icon |
| 32px | Empty state, hero |

### Icone Principali per Sezione

| Sezione | Icona |
|---------|-------|
| Dashboard | `layout-dashboard` |
| Planner | `calendar-days` |
| Comune e Catasto | `building-2` |
| APE | `file-check-2` |
| Varie | `folder-open` |
| Contabilità | `calculator` |
| Fatture | `file-text` |
| Spese | `credit-card` |
| Rubrica | `users` |
| Parametri | `settings` |
| Ricerca | `search` |
| Nuovo/Aggiungi | `plus-circle` |
| Modifica | `pencil` |
| Elimina | `trash-2` |
| Notifiche | `bell` |
| Shortcut | `command` |
| Successo | `check-circle` |
| Errore | `alert-circle` |
| Warning | `alert-triangle` |
| Euro/Importi | `euro` |
| Trend | `trending-up` |
| Mappa | `map-pin` |

### Brand Mark
- **Nessun logo Smart-geo fornito.** Il wordmark è in Space Grotesk; il mark accompagnante è un **triangolo di rilevamento benchmark** (▲ con punto centrale) disegnato come piccolo SVG inline in un chip signal-orange.
- Se Smart-Geo ha un logo ufficiale, inserirlo in `assets/` e sostituirlo nei wordmark Sidebar/Login.
- **Emoji / unicode icons:** non usate.

---

## INDEX / MANIFEST

### Struttura File

```
Root:
├── styles.css              — global entry (importare questo file)
│   └── @import tokens + font closure
├── tokens/
│   ├── colors.css          — color tokens
│   ├── typography.css      — font families + scale
│   ├── spacing.css         — spacing scale + radius + shadow
│   └── fonts.css           — Google Fonts (Space Grotesk, IBM Plex Sans, IBM Plex Mono)
├── guidelines/
│   ├── colors.html         — color specimen cards
│   ├── typography.html     — type specimen
│   ├── spacing.html        — spacing scale
│   └── brand.html          — brand mark + principles
├── components/
│   ├── core/
│   │   ├── Button.js       — primary action; variants signal/solid-ink/outline/ghost/danger
│   │   ├── Input.js        — labelled text field; leading icon, hint/error, mono
│   │   ├── Card.js         — base surface; header, flush, accent, clickable
│   │   └── Badge.js        — status pill; tones neutral/signal/success/warning/danger/topo
│   ├── data/
│   │   ├── StatCard.js     — dashboard KPI tile; mono value, icon chip, trend
│   │   └── Table.js        — sortable table with context menu, empty state
│   ├── feedback/
│   │   ├── Modal.js        — centered dialog over blurred scrim; header, body, footer
│   │   ├── Toast.js        — notification system; success/error/warning/info
│   │   ├── ConfirmDialog.js — irreversible action confirmation
│   │   └── Skeleton.js     — loading placeholder
│   └── navigation/
│       ├── Sidebar.js      — deep-ink app rail with wordmark, grouped nav
│       ├── CommandPalette.js — Cmd+K universal search modal
│       └── ContextMenu.js  — right-click menu for cards/tables
├── ui_kits/
│   └── smart-geo-app/
│       └── index.html      — interactive: Login → Dashboard → Rubrica
└── SKILL.md                — Agent-Skill entry point
```

### Componenti Disponibili

Import via `const { X } = window.SmartGeoDesignSystem_118051` after loading `_ds_bundle.js`.

| Componente | Categoria | Descrizione |
|------------|-----------|-------------|
| Button | core | Primary action; variants + loading + shortcut hint |
| Input | core | Labelled text field; mono for data |
| Card | core | Base surface; header, flush, accent, clickable |
| Badge | core | Status pill; tones + optional dot |
| StatCard | data | Dashboard KPI tile; mono value, trend |
| Table | data | Sortable table; context menu, empty state |
| Modal | feedback | Centered dialog; 4 sizes, focus trap |
| Toast | feedback | Notification system; 4 types, auto-dismiss |
| ConfirmDialog | feedback | Irreversible action confirmation |
| Skeleton | feedback | Loading placeholder with shimmer |
| Sidebar | navigation | Deep-ink rail; 3 sections, icon-only mode |
| CommandPalette | navigation | Cmd+K universal search |
| ContextMenu | navigation | Right-click menu for cards/tables |

### UI Kits

- **Smart-Geo App** (`ui_kits/smart-geo-app/index.html`) — interattivo: **Login → Dashboard → Rubrica**. Log in per entrare nella shell; la sidebar instrada tra una Dashboard live (3 KPI + quick actions + attività recenti) e una Rubrica live (tabella contatti ricercabile + modale "nuovo contatto"). Altre sezioni con note condivisa.

---

## CAVEATS & INTENZIONI

- **Nuova identità, su richiesta** — non corrisponde allo styling di produzione attuale.
- **Font:** Space Grotesk, IBM Plex Sans & IBM Plex Mono caricati da Google Fonts (tutti disponibili gratuitamente).
- **Icone via CDN** (Lucide) piuttosto che asset bundled, riflettendo la reale icon set dell'app.
- **Nessun asset logo fornito** — il mark triangolo benchmark è un placeholder originale — sostituire con il logo ufficiale quando disponibile.
- **v2 Focus:** usabilità, shortcut, feedback istantaneo, dashboard minimalista.
- **Compatibilità:** sistema progettato per React + TypeScript + Tailwind CSS + Supabase.

---

## CHANGELOG v2

| Data | Modifica |
|------|----------|
| 04/07/2026 | Riscrittura completa v2 — Focus usabilità |
| — | Aggiunti Design Principles (Misura, Azione, Feedback) |
| — | Dashboard semplificata: 3 KPI + Quick Actions + Attività Recenti |
| — | Sistema Shortcut: Cmd+K universal search + menu contestuale |
| — | Sistema Feedback: toast notifications + skeleton loading + stati interattivi |
| — | Layout ristrutturato: sidebar 240px, topbar 48px |
| — | Componenti aggiornati: Button loading, Input mono, Table sortable, Card clickable |
| — | Responsive definito: Mobile/Tablet/Desktop breakpoints |
| — | Animazioni standardizzate: timing, easing, property |
| — | Iconografia aggiornata: nuove icone per shortcut/feedback |
