# CLAUDE.md — Reading Assistant (vocab-app)

> Companion file: [.github/copilot-instructions.md](.github/copilot-instructions.md)
> Keep both files in sync when the architecture, conventions, or tooling changes.

## What this project is

A single-page Vue 3 app for translating words and phrases via a local
translation service API (https://github.com/noxpert/translation-service). 
The primary loop: type a word → translate → review
result (input word + root word) → optionally save to the database.
Part of a broader language-learning toolkit.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 — Composition API, `<script setup>` throughout |
| UI | Vuetify 3 — Material Design; primary color `#00695C` (teal-darken-2) |
| State | Pinia — Composition API store style |
| Persistence | pinia-plugin-persistedstate — persists `sourceLang` + `targetLang` only |
| Build | Vite 5 |
| Production | nginx:alpine serving the static build; `/api/*` proxied to translation service |
| Icons | MDI (`@mdi/font`) |

## Project structure

```
src/
  main.js                 Vue entry — registers Vuetify, Pinia, mounts App
  App.vue                 Shell: app bar, service-unavailable banner, health check
  components/
    TranslateForm.vue     Language selects, word input, context textarea, translate button
    ResultCard.vue        Two WordPanels side-by-side + optional notes section
    WordPanel.vue         Single word display — source/target text, POS select, save button
    StatusChip.vue        "In database" / "Not in database" / "Checking..." chip
  services/
    api.js                All fetch calls; structured error throwing
  stores/
    translate.js          Single Pinia store: all app state + actions
```

## Running locally

```bash
# Dev server (requires translation service on :8081)
make dev          # or: npm install && npm run dev → http://localhost:5173

# Docker production build (serves on :8082)
make build && make up
```

## API / proxy

The translation service runs separately on port 8081. All API calls use the
`/api` prefix, which is stripped before forwarding:

- **Dev**: Vite proxy (`vite.config.js`) strips `/api` and forwards to `http://localhost:8081`
- **Prod**: nginx strips `/api` and forwards to `http://host.docker.internal:8081`

Never hardcode `localhost:8081` in Vue code — always use `/api/*`.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8081` | Translation service base URL |
| `VITE_DEFAULT_SOURCE_LANG` | `hu` | Initial source language (first load only) |
| `VITE_DEFAULT_TARGET_LANG` | `en` | Initial target language (first load only) |
| `VITE_SOURCE_NAME` | `vocab-app` | Provenance tag sent on every save |

Copy `.env.example` to `.env` to configure. After first load, `sourceLang` and
`targetLang` are persisted to localStorage and override these defaults.

## State conventions (translate.js store)

The store uses Pinia Composition API style. Key state semantics:

```
inputWordStatus / rootWordStatus:
  null    → database check in progress ("Checking...")
  false   → word not found in database ("Not in database")
  object  → found record ("In database") — also disables the Save button
```

All API actions catch errors and set `store.error` — never let an exception
propagate out of a store action.

## Component conventions

- All components use `<script setup>` (no Options API)
- Props use object syntax with `type`, `required`, or `default`
- Emits are declared with `defineEmits`
- Components access the store directly (`useTranslateStore()`) except `WordPanel`
  and `StatusChip`, which are pure presentational (props/emits only)
- Vuetify classes are preferred over custom CSS (e.g. `text-medium-emphasis`,
  `font-weight-medium`, `mb-4`)

## Key business logic

**Search is substring-based** — the backend `/search` endpoint may return more
results than expected. `findExactMatch()` in the store filters client-side for
an exact case-insensitive match across all translations of each record.

**Parallel search after translation** — after a successful translate, two
`POST /search` calls run in parallel (via `Promise.all`) to check database
status for the input word and root word simultaneously.

**Null root** — if `result.root_source` is null, the word is already in root
form. `rootWordStatus` is set to `false` immediately (no search needed), and
`WordPanel` renders the "already in root form" message instead of save UI.

**Save payload** always includes:
- `source_name: 'vocab-app'` (provenance tracking)
- `is_verified: false` (verification is a separate future workflow)
- `context` from the input textarea (null if empty)

## API surface used

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check on startup |
| GET | `/languages` | Language dropdown options |
| GET | `/parts-of-speech` | POS dropdown options |
| POST | `/translate` | Translate input text |
| POST | `/search` | Check if word is already in database |
| POST | `/words` | Save a word + translations |
| POST | `/phrases` | Save a phrase + translations (available in api.js, not yet in UI) |

## Code quality tools

ESLint and Prettier are the recommended additions — see install instructions below.

```bash
npm install -D eslint eslint-plugin-vue @vue/eslint-config-prettier prettier
```

Config files to add: `eslint.config.js` and `.prettierrc.json`.
Run via `npm run lint` and `npm run format` (add to `package.json` scripts).

See [.github/copilot-instructions.md](.github/copilot-instructions.md) for
the full recommended config and rationale.

## What not to do

- Do not use Options API — this codebase is Composition API only
- Do not add TypeScript without a deliberate migration plan (currently plain JS)
- Do not call the translation service directly from components — all API calls go
  through `src/services/api.js`
- Do not put business logic in components — it belongs in the store
- Do not add custom CSS for spacing/color when a Vuetify utility class exists
- Do not commit `.env` — it is gitignored; use `.env.example` for documentation
- Do not include the translation service in `docker-compose.yml` — it runs independently
