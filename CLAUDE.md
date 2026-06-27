# CLAUDE.md — Reading Assistant (vocab-app)

> Companion file: [.github/copilot-instructions.md](.github/copilot-instructions.md)
> Keep both files in sync when the architecture, conventions, or tooling changes.

## What this project is

A single-page Vue 3 app for translating words and phrases via a local
translation service API (https://github.com/noxpert/translation-service).
The primary loop: type a word or phrase → translate → review result → optionally
save to the database. Part of a broader language-learning toolkit.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Vue 3 — Composition API, `<script setup>` throughout |
| UI | Vuetify 3 — Material Design; primary color `#00695C` (teal-darken-2) |
| State | Pinia — Composition API store style |
| Persistence | pinia-plugin-persistedstate — persists `sourceLang` + `targetLang` only |
| Build | Vite 6 |
| Production | nginx:alpine serving the static build; `/api/*` proxied to translation service |
| Icons | MDI (`@mdi/font`) |
| Testing | Vitest + @vue/test-utils + happy-dom |
| Linting | ESLint (`eslint-plugin-vue` flat/recommended) + Prettier |

## Project structure

```
src/
  main.js                 Vue entry — registers Vuetify, Pinia, mounts App
  App.vue                 Shell: app bar, service-unavailable banner, health check
  components/
    TranslateForm.vue     Language selects, word input, context textarea, validate checkbox, translate button
    ValidationPanel.vue   Correction picker shown when validate returns is_valid=false (presentational)
    ResultCard.vue        One or two WordPanels + optional notes section
    WordPanel.vue         Single word/phrase display — text, POS select, save button
    StatusChip.vue        "In database" / "Not in database" / "Checking..." chip
  services/
    api.js                All fetch calls; structured error throwing
  stores/
    translate.js          Single Pinia store: all app state + actions
    database.js           Pinia store: database browse/search state + actions
  router/
    index.js              Vue Router — / → DatabasePage, /translate → TranslatePage
  views/
    DatabasePage.vue      Browse and search saved words/phrases
    TranslatePage.vue     Translate form + result card
tests/
  setup.js                Vitest global setup: Vuetify plugin, browser API class mocks
  stores/
    translate.test.js     Store tests
  components/
    StatusChip.test.js
    WordPanel.test.js
    ResultCard.test.js
    ValidationPanel.test.js
```

## Running locally

```bash
# Dev server (requires translation service on :8081)
make dev          # or: npm install && npm run dev → http://localhost:5173

# Docker production build (serves on :8082)
make build && make up

# Tests
make test         # or: npm test

# Lint + format checks
make lint         # or: npm run lint && npm run format:check
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
| `VITE_SPACE_INDICATES_PHRASE` | `true` | Treat spaced input as a phrase |

Copy `.env.example` to `.env` to configure. After first load, `sourceLang` and
`targetLang` are persisted to localStorage and override their defaults.

## State conventions (translate.js store)

The store uses Pinia Composition API style. Key state semantics:

```
inputWordStatus / rootWordStatus:
  null    → database check in progress ("Checking...")
  false   → not found in database ("Not in database")
  object  → found record ("In database") — also disables the Save button

isPhrase:
  false   → input is a single word: show POS select, show root word panel
  true    → input is a phrase: hide POS select, hide root word panel,
            save via POST /phrases, search phrases[] array for status

validateBeforeTranslate:
  false   → (default) skip validation, translate immediately
  true    → call POST /validate before translating; on is_valid=false, pause
            and show ValidationPanel; on is_valid=true, set validationNotice='valid'
            and proceed to translate

validationPending:
  null        → no pending correction selection
  { originalText, corrections }
              → validation returned is_valid=false; UI shows ValidationPanel;
                translate is blocked until selectCorrection() is called

validationNotice:
  null    → no notice
  'valid' → validation passed; shown briefly while translate is in progress
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

**Phrase detection** — at the start of `doTranslate()`, `isPhrase` is set to
`true` when `VITE_SPACE_INDICATES_PHRASE !== 'false'` and the trimmed input
contains a space. This is evaluated per-translation; the result card adapts its
layout accordingly.

**Search is substring-based** — the backend `/search` endpoint may return more
results than expected. `findExactMatch()` in the store filters client-side for
an exact case-insensitive match across all translations of each record.

**Phrase vs word database check** — after translation, `checkDatabaseStatus()`
routes to `results.phrases` (for phrases) or `results.words` (for words). For
phrases, only one search call is made (no root). For words with a root, two
searches run in parallel via `Promise.all`.

**Null root** — if `result.root_source` is null, the word is already in root
form. `rootWordStatus` is set to `false` immediately (no search needed), and
`WordPanel` renders the "already in root form" message instead of save UI.

**Save payload** always includes:
- `source_name: 'vocab-app'` (provenance tracking)
- `context` from the input textarea (null if empty)
- Words additionally include `part_of_speech` and `is_verified: false`
- Phrases omit both (phrases have neither POS nor verification workflow)

## API surface used

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | Health check on startup |
| GET | `/languages` | Language dropdown options |
| GET | `/parts-of-speech` | POS dropdown options |
| POST | `/validate` | Check spelling/grammar before translating (optional) |
| POST | `/translate` | Translate input text |
| POST | `/search` | Check if word/phrase is already in database |
| POST | `/words` | Save a word + translations |
| POST | `/phrases` | Save a phrase + translations |

## Testing

Stack: **Vitest** + **@vue/test-utils** + **happy-dom** (71 tests).

```bash
npm test              # run once
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

**Test setup decisions** (in `vite.config.js` and `tests/setup.js`):

- `vite-plugin-vuetify` is disabled in test mode (`process.env.VITEST`) to prevent
  it from transforming Vuetify's own component files when they are inlined, which
  would strip render functions from internal components like `VProgressLinear`
- A `cssStubPlugin` intercepts all `.css` loads and returns an empty string, since
  happy-dom can't process Vuetify's CSS as Node.js ESM modules
- `server.deps.inline: ['vuetify']` routes Vuetify through Vite's pipeline so the
  CSS stub can intercept those imports
- `ResizeObserver` and `IntersectionObserver` are mocked as **classes** (not arrow
  functions) because Vuetify calls them with `new`

New store tests go in `tests/stores/translate.test.js`. New component tests go in
`tests/components/`. Mock `../../src/services/api.js` with `vi.mock` and set up a
fresh Pinia per test with `setActivePinia(createPinia())`.

## Code quality

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only — used in CI)
make lint             # runs both lint and format:check
```

Config files: `eslint.config.js`, `.prettierrc.json`.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs three independent jobs on every
PR to `main` and every push to `main`:

| Job | Steps |
|---|---|
| Lint & Format | `npm run lint` + `npm run format:check` |
| Tests | `npm test` |
| Build | `npm run build` |

## What not to do

- Do not use Options API — this codebase is Composition API only
- Do not add TypeScript without a deliberate migration plan (currently plain JS)
- Do not call the translation service directly from components — all API calls go
  through `src/services/api.js`
- Do not put business logic in components — it belongs in the store
- Do not add custom CSS for spacing/color when a Vuetify utility class exists
- Do not commit `.env` — it is gitignored; use `.env.example` for documentation
- Do not include the translation service in `docker-compose.yml` — it runs independently
- Do not use arrow functions as browser API mocks in tests — Vuetify needs `new`
