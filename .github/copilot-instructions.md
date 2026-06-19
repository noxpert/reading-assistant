# GitHub Copilot Instructions — Reading Assistant (vocab-app)

> Companion file: [CLAUDE.md](../CLAUDE.md)
> Keep both files in sync when the architecture, conventions, or tooling changes.

## Project overview

A Vue 3 SPA for translating words/phrases via a local
translation service (https://github.com/noxpert/translation-service).
Users type a word or phrase, get a translation with root-word analysis, then
optionally save either (or both) to a vocabulary database.
Part of a larger language-learning toolkit.

## Stack at a glance

- **Vue 3** — Composition API, `<script setup>` on every component, no Options API
- **Vuetify 3** — all UI components; primary color `teal-darken-2` (`#00695C`)
- **Pinia** — single store (`useTranslateStore`), Composition API store style
- **pinia-plugin-persistedstate** — only `sourceLang` and `targetLang` are persisted
- **Vite 6** — dev server on port 5173, proxies `/api/*` to `http://localhost:8081`
- **nginx:alpine** — production container (port 8082), also proxies `/api/*`
- **MDI icons** — `@mdi/font`, always use `mdi-*` icon names
- **Vitest + @vue/test-utils + happy-dom** — unit and component tests
- **ESLint + Prettier** — enforced in CI

## File map

```
src/main.js                 Bootstrap: Vuetify + Pinia + App mount
src/App.vue                 Root shell, health check on mount, service banner
src/components/
  TranslateForm.vue         Language selects, word input, context, translate button
  ResultCard.vue            One or two WordPanels + notes section
  WordPanel.vue             Pure presentational: word/phrase display + POS select + save
  StatusChip.vue            Pure presentational: database status chip
src/services/api.js         All fetch calls, error normalisation
src/stores/translate.js     All state + async actions
tests/
  setup.js                  Vitest global: Vuetify plugin, ResizeObserver/IntersectionObserver class mocks
  stores/translate.test.js  43 store tests
  components/               StatusChip, WordPanel, ResultCard tests
```

## Patterns to follow

### Components

```vue
<!-- Always <script setup>, never Options API -->
<script setup>
import { computed } from 'vue'
import { useTranslateStore } from '../stores/translate.js'

const props = defineProps({
  label: { type: String, required: true },
  saving: { type: Boolean, default: false },
})

defineEmits(['save'])
</script>
```

- `WordPanel` and `StatusChip` are **pure presentational** — props in, emits out,
  no store access. All other components may access the store directly.
- Prefer Vuetify utility classes (`text-medium-emphasis`, `mb-4`, `pa-3`) over
  scoped CSS for spacing and typography.

### Store actions

All async actions in `translate.js` follow this pattern:

```js
async function doSomething() {
  loadingFlag.value = true
  try {
    const result = await api.someCall(...)
    // update state
  } catch (err) {
    error.value = err.message ?? 'Fallback message.'
  } finally {
    loadingFlag.value = false
  }
}
```

Never let exceptions propagate out of store actions.

### API calls

All fetch calls go through `src/services/api.js`. Never call `fetch` directly
from components or the store. The `request()` helper normalises errors:

- **Network failure** → `{ status: 0, message: 'Translation service is not responding...' }`
- **HTTP error** → `{ status: <code>, message: <detail from body or statusText> }`

### Database status pattern

```
inputWordStatus / rootWordStatus:
  null    → check in progress
  false   → not in database (Save button enabled)
  object  → found record (Save button disabled, shows "Saved")
```

### Phrase vs word

```
isPhrase (store):
  false  → single word: show POS select, show root word panel, save via POST /words
  true   → phrase: hide POS select, hide root word panel, save via POST /phrases
```

`isPhrase` is set at the start of `doTranslate()` based on whether the trimmed
input contains a space AND `VITE_SPACE_INDICATES_PHRASE !== 'false'` (default true).

### API proxy

All requests use the `/api` prefix. Both Vite (dev) and nginx (prod) strip it
before forwarding to the translation service. Never hardcode port 8081 in Vue code.

## Writing tests

### Setup

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTranslateStore } from '../../src/stores/translate.js'
import * as api from '../../src/services/api.js'

vi.mock('../../src/services/api.js', () => ({
  translate: vi.fn(),
  search: vi.fn(),
  saveWord: vi.fn(),
  savePhrase: vi.fn(),
  // ... other api functions
}))

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})
```

### Component tests

```js
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// vuetify is already in config.global.plugins from tests/setup.js

function mountWithStore(storeOverrides = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const store = useTranslateStore()
  Object.assign(store, storeOverrides)
  return mount(MyComponent, { global: { plugins: [pinia] } })
  // Do NOT also pass vuetify here — it is already in global config from setup.js
}
```

### Browser API mocks — must be classes

Vuetify calls `new ResizeObserver(...)` and `new IntersectionObserver(...)`.
Arrow functions cannot be constructors. The mocks in `tests/setup.js` use classes.
Do not change them to arrow functions or `vi.fn().mockImplementation(() => (...))`.

```js
// Correct
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.IntersectionObserver = MockIntersectionObserver

// Wrong — arrow function cannot be called with new
global.IntersectionObserver = vi.fn().mockImplementation(() => ({ observe: vi.fn() }))
```

### Vite test config decisions

In `vite.config.js`, when `process.env.VITEST` is set:
- `vite-plugin-vuetify` is replaced by `cssStubPlugin` — the Vuetify plugin
  must not run on Vuetify's own source files when they are inlined, or it strips
  render functions from internal components
- `server.deps.inline: ['vuetify']` routes Vuetify through Vite so CSS imports
  are intercepted by the stub plugin (not loaded raw by Node.js)

## Constraints

- No Options API anywhere
- No direct `fetch` calls outside `src/services/api.js`
- No business logic in components — it goes in the store
- No custom CSS when a Vuetify utility class covers the need
- `.env` is gitignored — document new variables in `.env.example` instead
- The translation service is **not** in `docker-compose.yml` — it runs independently on port 8081
- Words: always send `part_of_speech` and `is_verified: false`; phrases: omit both
- `POST /search` returns substring matches — always filter with `findExactMatch()` client-side
- `source_name: 'vocab-app'` is always sent on every save (word and phrase)
- For phrases, only one `POST /search` is made (no root search, `rootWordStatus = false`)

## Code quality

```bash
npm run lint          # ESLint
npm run lint:fix      # auto-fix
npm run format        # Prettier write
npm run format:check  # Prettier check (CI uses this)
npm test              # Vitest run
npm run test:watch    # Vitest watch
make lint             # lint + format:check together
make test             # Vitest run
```

Config files: `eslint.config.js` (flat config, `vue/flat/recommended` + Prettier),
`.prettierrc.json` (no semis, single quotes, trailing commas, 100-char width).

## CI

`.github/workflows/ci.yml` runs three independent jobs on every PR to `main`
and every push to `main`:

| Job | What runs |
|---|---|
| Lint & Format | `npm run lint` + `npm run format:check` |
| Tests | `npm test` |
| Build | `npm run build` |
