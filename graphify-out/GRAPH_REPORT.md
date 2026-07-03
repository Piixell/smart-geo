# Graph Report - .  (2026-07-03)

## Corpus Check
- Corpus is ~48,223 words - fits in a single context window. You may not need a graph.

## Summary
- 330 nodes · 423 edges · 29 communities detected
- Extraction: 86% EXTRACTED · 14% INFERRED · 0% AMBIGUOUS · INFERRED: 59 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Auth & Schema Migrations|Auth & Schema Migrations]]
- [[_COMMUNITY_Ape Page Logic|Ape Page Logic]]
- [[_COMMUNITY_ComuneCatasto Page Logic|ComuneCatasto Page Logic]]
- [[_COMMUNITY_Parametri Config CRUD|Parametri Config CRUD]]
- [[_COMMUNITY_Varie Page Logic|Varie Page Logic]]
- [[_COMMUNITY_Contabilita & Invoicing|Contabilita & Invoicing]]
- [[_COMMUNITY_Planner Drag Tasks|Planner Drag Tasks]]
- [[_COMMUNITY_Page Components Registry|Page Components Registry]]
- [[_COMMUNITY_FattureNonContabilizzate|FattureNonContabilizzate]]
- [[_COMMUNITY_Rubrica Contacts CRUD|Rubrica Contacts CRUD]]
- [[_COMMUNITY_RubricaAutocomplete Component|RubricaAutocomplete Component]]
- [[_COMMUNITY_AuthTheme Stores|Auth/Theme Stores]]
- [[_COMMUNITY_Scadenze Schema & Types|Scadenze Schema & Types]]
- [[_COMMUNITY_Login & UserSettings|Login & UserSettings]]
- [[_COMMUNITY_Logo SVG Assets|Logo SVG Assets]]
- [[_COMMUNITY_FattureNonContabilizzate Schema|FattureNonContabilizzate Schema]]
- [[_COMMUNITY_ParametriFatturazione Schema|ParametriFatturazione Schema]]
- [[_COMMUNITY_Fatture Schema & Type|Fatture Schema & Type]]
- [[_COMMUNITY_Vite Build Config|Vite Build Config]]
- [[_COMMUNITY_main Entry|main Entry]]
- [[_COMMUNITY_AppLayout Component|AppLayout Component]]
- [[_COMMUNITY_Sidebar Component|Sidebar Component]]
- [[_COMMUNITY_Sidebar Menu Items|Sidebar Menu Items]]
- [[_COMMUNITY_SidebarItem|SidebarItem]]
- [[_COMMUNITY_handleSupabaseError|handleSupabaseError]]
- [[_COMMUNITY_Types Definitions|Types Definitions]]
- [[_COMMUNITY_AuthUser Type|AuthUser Type]]
- [[_COMMUNITY_ParametriAzienda Schema|ParametriAzienda Schema]]
- [[_COMMUNITY_DB Schema Doc|DB Schema Doc]]

## God Nodes (most connected - your core abstractions)
1. `fetchData()` - 11 edges
2. `fetchData()` - 10 edges
3. `supabase client` - 10 edges
4. `fetchData()` - 9 edges
5. `loadAllData()` - 9 edges
6. `comune_catasto table` - 9 edges
7. `ComuneCatastoPage` - 8 edges
8. `handleSubmit()` - 6 edges
9. `handleSaveFattura()` - 6 edges
10. `getUserProfile helper` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Automatic profile creation on signup from email username (design rationale)` --rationale_for--> `getUserProfile helper`  [INFERRED]
  WARP.md → src/store/authStore.ts
- `Row Level Security on all tables (design rationale)` --rationale_for--> `profiles table`  [INFERRED]
  WARP.md → database_setup.sql
- `Row Level Security on all tables (design rationale)` --rationale_for--> `comune_catasto table`  [INFERRED]
  WARP.md → database_setup.sql
- `React logo SVG asset` --semantically_similar_to--> `Vite logo SVG asset`  [INFERRED] [semantically similar]
  src/assets/react.svg → public/vite.svg
- `Remember Me persistence via localStorage flag (design rationale)` --rationale_for--> `useAuthStore`  [INFERRED]
  WARP.md → src/store/authStore.ts

## Hyperedges (group relationships)
- **Auth flow: initialize -> ProtectedRoute -> routes** — app_app, authstore_initialize, protectedroute_protectedroute, supabase_supabase [INFERRED 0.85]
- **Rubrica contact management (autocomplete + sync + table)** — rubricaautocomplete_rubricaautocomplete, rubricasync_syncrubricafrompratica, database_setup_rubrica [INFERRED 0.85]
- **Core practice management tables (comune_catasto + ape + varie)** — database_setup_comune_catasto, database_setup_ape, database_setup_varie [INFERRED 0.85]
- **Pratiche CRUD pages sharing rubrica sync + realtime + pagamento toggle pattern** — apepage, comunecatastopage, variepage [INFERRED 0.95]
- **Dashboard aggregates stats from all practice/fatture/scadenze tables** — dashboard, comunecatastopage, apepage, variepage, spese, contabilita [INFERRED 0.95]
- **Parametri centralizes config consumed by Contabilita, Ape, ComuneCatasto, Varie, Planner** — parametri, contabilita, apepage, comunecatastopage, variepage, planner [INFERRED 0.85]

## Communities

### Community 0 - "Auth & Schema Migrations"
Cohesion: 0.06
Nodes (44): ALTER varie ADD telefono2, tipi_pratica table + FK, App (root router), getUserProfile helper, authStore.initialize, authStore.resetPassword, authStore.signIn, authStore.signOut (+36 more)

### Community 1 - "Ape Page Logic"
Cohesion: 0.09
Nodes (21): closeModal(), combineTelefoni(), fetchAvailableYears(), fetchData(), formatPhoneNumber(), generaProgressivoAutomatico(), handleChangeStatusFromContextMenu(), handleContextMenuAction() (+13 more)

### Community 2 - "ComuneCatasto Page Logic"
Cohesion: 0.1
Nodes (20): closeModal(), combineTelefoni(), fetchData(), formatTelefono(), getTipoIncaricoSelezionato(), handleChangeStatusFromContextMenu(), handleContextMenuAction(), handleDeletePratica() (+12 more)

### Community 3 - "Parametri Config CRUD"
Cohesion: 0.14
Nodes (24): deleteCategoriaPlanner(), deleteParametroFatturazione(), deleteStatoApe(), deleteStatoGenerale(), deleteStatoScadenza(), deleteTipoIncarico(), deleteTipoPratica(), getNextOrderPosition() (+16 more)

### Community 4 - "Varie Page Logic"
Cohesion: 0.12
Nodes (17): closeModal(), combineTelefoni(), fetchData(), formatTelefono(), handleChangeStatusFromContextMenu(), handleContextMenuAction(), handleDeleteVaria(), handleDuplicateVaria() (+9 more)

### Community 5 - "Contabilita & Invoicing"
Cohesion: 0.16
Nodes (14): calculateValues(), calculateValuesWithPercent(), ensureParametriTasse(), fetchAnniDisponibili(), fetchFatture(), getNextNumeroFattura(), handleContextMenuAction(), handleDeleteFattura() (+6 more)

### Community 6 - "Planner Drag Tasks"
Cohesion: 0.13
Nodes (10): fixOrderPositions(), formatDateLocal(), getMondayOfWeek(), goToCurrentWeek(), handleAddTaskToCell(), handleAddTaskToCellEvent(), handleDragEnd(), handleKeyDown() (+2 more)

### Community 7 - "Page Components Registry"
Cohesion: 0.18
Nodes (19): ApePage, ApePage.generaProgressivoAutomatico, ComuneCatastoPage, ComuneCatastoPage.verificaEAggiornaStatoCompletata, Contabilita, Contabilita.calculateValues, Contabilita.getNextNumeroFattura, Contabilita.loadParametriTasse (+11 more)

### Community 8 - "FattureNonContabilizzate"
Cohesion: 0.22
Nodes (8): closeModal(), fetchFatture(), handleDeleteFattura(), handleFilter(), handleSubmit(), openModal(), resetForm(), validateForm()

### Community 9 - "Rubrica Contacts CRUD"
Cohesion: 0.29
Nodes (5): fetchContatti(), handleDeleteContatto(), handleSubmit(), handleToggleStato(), resetForm()

### Community 11 - "RubricaAutocomplete Component"
Cohesion: 0.4
Nodes (2): handleKeyDown(), handleSelect()

### Community 12 - "Auth/Theme Stores"
Cohesion: 0.33
Nodes (6): useAuthStore, Header, ProtectedRoute, Remember Me persistence via localStorage flag (design rationale), themeStore.toggleTheme, useThemeStore

### Community 14 - "Scadenze Schema & Types"
Cohesion: 0.5
Nodes (4): scadenze table, stati_scadenze table, Scadenza interface, StatoScadenza interface

### Community 15 - "Login & UserSettings"
Cohesion: 0.5
Nodes (4): Login, Login.onSubmit, UserSettings, UserSettings.handlePasswordChange

### Community 22 - "Logo SVG Assets"
Cohesion: 1.0
Nodes (2): React logo SVG asset, Vite logo SVG asset

### Community 23 - "FattureNonContabilizzate Schema"
Cohesion: 1.0
Nodes (2): fatture_non_contabilizzate table, FatturaNonContabilizzata interface

### Community 24 - "ParametriFatturazione Schema"
Cohesion: 1.0
Nodes (2): parametri_fatturazione table, ParametroFatturazione interface

### Community 25 - "Fatture Schema & Type"
Cohesion: 1.0
Nodes (2): fatture table, Fattura interface

### Community 26 - "Vite Build Config"
Cohesion: 1.0
Nodes (1): Manual chunks disabled in Vite for simpler builds (design rationale)

### Community 37 - "main Entry"
Cohesion: 1.0
Nodes (1): main.tsx entry

### Community 38 - "AppLayout Component"
Cohesion: 1.0
Nodes (1): AppLayout

### Community 39 - "Sidebar Component"
Cohesion: 1.0
Nodes (1): Sidebar

### Community 40 - "Sidebar Menu Items"
Cohesion: 1.0
Nodes (1): Sidebar.menuItems

### Community 41 - "SidebarItem"
Cohesion: 1.0
Nodes (1): SidebarItem

### Community 42 - "handleSupabaseError"
Cohesion: 1.0
Nodes (1): handleSupabaseError

### Community 43 - "Types Definitions"
Cohesion: 1.0
Nodes (1): types/index.ts

### Community 44 - "AuthUser Type"
Cohesion: 1.0
Nodes (1): AuthUser interface

### Community 45 - "ParametriAzienda Schema"
Cohesion: 1.0
Nodes (1): parametri_azienda table

### Community 46 - "DB Schema Doc"
Cohesion: 1.0
Nodes (1): DB_Schema.sql (empty)

## Knowledge Gaps
- **46 isolated node(s):** `Vite logo SVG asset`, `React logo SVG asset`, `App (root router)`, `main.tsx entry`, `AppLayout` (+41 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `RubricaAutocomplete Component`** (6 nodes): `formatPhone()`, `handleClickOutside()`, `handleInputChange()`, `handleKeyDown()`, `handleSelect()`, `RubricaAutocomplete.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Logo SVG Assets`** (2 nodes): `React logo SVG asset`, `Vite logo SVG asset`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `FattureNonContabilizzate Schema`** (2 nodes): `fatture_non_contabilizzate table`, `FatturaNonContabilizzata interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ParametriFatturazione Schema`** (2 nodes): `parametri_fatturazione table`, `ParametroFatturazione interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Fatture Schema & Type`** (2 nodes): `fatture table`, `Fattura interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Vite Build Config`** (2 nodes): `Manual chunks disabled in Vite for simpler builds (design rationale)`, `vite.config.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `main Entry`** (1 nodes): `main.tsx entry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AppLayout Component`** (1 nodes): `AppLayout`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Component`** (1 nodes): `Sidebar`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Sidebar Menu Items`** (1 nodes): `Sidebar.menuItems`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `SidebarItem`** (1 nodes): `SidebarItem`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `handleSupabaseError`** (1 nodes): `handleSupabaseError`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Types Definitions`** (1 nodes): `types/index.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `AuthUser Type`** (1 nodes): `AuthUser interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `ParametriAzienda Schema`** (1 nodes): `parametri_azienda table`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `DB Schema Doc`** (1 nodes): `DB_Schema.sql (empty)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `syncRubricaFromPratica()` connect `Ape Page Logic` to `ComuneCatasto Page Logic`, `Varie Page Logic`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **Why does `handleSubmit()` connect `ComuneCatasto Page Logic` to `Ape Page Logic`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `supabase client` (e.g. with `README.md` and `WARP.md`) actually correct?**
  _`supabase client` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Vite logo SVG asset`, `React logo SVG asset`, `App (root router)` to the rest of the system?**
  _46 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Auth & Schema Migrations` be split into smaller, more focused modules?**
  _Cohesion score 0.06 - nodes in this community are weakly interconnected._
- **Should `Ape Page Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `ComuneCatasto Page Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._