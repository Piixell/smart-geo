# AGENTS.md - Smart-Geo

## Commands

```bash
npm run dev          # Vite dev server (HMR on port 443)
npm run build        # tsc --noEmit && vite build (typecheck + build)
npm run lint         # eslint .
npm run preview      # Vite preview of production build
```

**Typecheck separately:** `npx tsc --noEmit` (the build command runs this automatically, but for quick checks run it alone).

**No test framework.** There are no test files, no test runner, no test config. Do not write tests unless the user explicitly asks.

## Architecture

- **Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (PostgreSQL + Auth + Realtime)
- **State:** Zustand (`src/store/`), no React Query usage despite it being installed
- **Forms:** React Hook Form + Zod in some pages, raw state in others (ComuneCatasto uses manual `formData` state)
- **Routing:** React Router v6, all routes inside `ProtectedRoute` except `/login`
- **Backend:** Supabase client in `src/services/supabase.ts`. All queries filter by `user_id` via RLS.

### Directory layout

```
src/
  pages/          # One file per major feature (large, 800-2400 lines each)
  components/     # Shared UI: layout/, ContextMenu, RubricaAutocomplete, Toast
  store/          # Zustand stores (authStore, themeStore)
  services/       # Supabase client singleton
  types/          # TypeScript interfaces matching DB tables
  hooks/          # Custom hooks
  utils/          # Utility functions (rubricaSync, etc.)
```

### Page files are monoliths

Each page file (ComuneCatasto.tsx, Ape.tsx, Contabilita.tsx, etc.) contains the full CRUD lifecycle: fetch, state, form, modal, table, filters, pagination. When modifying a feature, you typically work within a single page file. The relevant page files are:

| File | Purpose |
|------|---------|
| `ComuneCatasto.tsx` | Main practice management (Comune + Catasto), ~2400 lines |
| `Ape.tsx` | Energy performance certificates |
| `Varie.tsx` | Miscellaneous practices |
| `Contabilita.tsx` | Accounting / invoicing |
| `Parametri.tsx` | System parameters (stati, tipi incarico, tipi pratica, etc.) |
| `Planner.tsx` | Weekly planner with drag-and-drop |
| `Rubrica.tsx` | Contact directory |
| `Spese.tsx` | Expense tracking |

## Critical conventions

### Database boolean fields returned as different types

Supabase may return database `boolean` columns as actual JS `true`/`false` or as `1`/`0` depending on the column type and Supabase version. **Always use truthy checks** for boolean flags, never `=== 1` or `=== true`:

```typescript
// WRONG - fails if DB returns true (boolean) instead of 1 (number)
if (tipoPratica.blocco_fine_lavori === 1) { ... }

// CORRECT - works for both true/1 and false/0
if (tipoPratica.blocco_fine_lavori) { ... }
```

This is a real bug that has been hit. See `ComuneCatasto.tsx` `isFlagAbilitatoInTabella` for the pattern.

### Dark mode

Dark mode uses **CSS variable overrides** in `src/index.css`, not Tailwind's `dark:` prefix. The `dark` class is toggled on `<html>`. Color utilities use the custom `ink-*`, `signal-*`, `topo-*` palette. When adding new components, use these token classes directly — the CSS overrides handle dark mode inversion automatically.

Do **not** add `dark:` prefixed utilities for colors that already have ink/signal/topo tokens. The CSS override layer handles it.

### Component classes

Reusable component styles are defined as `@layer components` in `src/index.css`: `.btn`, `.btn-primary`, `.card`, `.input`, `.table`, `.modal-overlay`, `.badge-*`, `.sidebar-item`, etc. Prefer these over inline Tailwind for consistency.

### Italian codebase

All variable names, comments, UI labels, and error messages are in Italian. Follow this convention.

### Supabase query patterns

- Always filter by `user_id`: `.eq('user_id', user?.id)`
- Use Supabase foreign key joins for related data: `tipo_incarico_info:tipi_incarico(id, descrizione, comune, catasto)`
- Realtime subscriptions are set up per-page in `useEffect` for live updates
- The `supabase` client is a singleton imported from `src/services/supabase.ts`

### TypeScript strict mode

`tsconfig.app.json` has `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. The build will fail on unused variables. Remove them or prefix with `_` if intentionally unused.

### No package-lock.json or lockfile strategy

The README says to use `npm install --legacy-peer-deps`. This is important for peer dependency conflicts.

## Gotchas

- **Vite HMR port is 443** (not default 5173) — configured in `vite.config.ts`
- **No CI/CD config** — no GitHub Actions, no pre-commit hooks
- **No test infrastructure** — no Jest, Vitest, or any test runner
- **Large page files** — editing ComuneCatasto.tsx requires reading 2400+ lines. Use offset/limit when reading.
- **The README SQL schema is outdated** — it doesn't reflect all current columns (e.g., `acconto`, `saldo`, `omaggio`, `proprieta2`, `telefono2` on comune_catasto). Trust the TypeScript types in `src/types/index.ts` over the README.
