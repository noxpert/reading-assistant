# GitHub Copilot Instructions — Reading Assistant (vocab-app)

> Companion file: [CLAUDE.md](../CLAUDE.md)
> Keep both files in sync when the architecture, conventions, or tooling changes.

## Project overview

A Vue 3 SPA for translating words/phrases via a local 
translation service (https://github.com/noxpert/translation-service). 
Users type a word, get a translation with root-word analysis, then optionally 
save either (or both) to a vocabulary database. 
Part of a larger language-learning toolkit.

## Stack at a glance

- **Vue 3** — Composition API, `<script setup>` on every component, no Options API
- **Vuetify 3** — all UI components; primary color `teal-darken-2` (`#00695C`)
- **Pinia** — single store (`useTranslateStore`), Composition API store style
- **pinia-plugin-persistedstate** — only `sourceLang` and `targetLang` are persisted
- **Vite 5** — dev server on port 5173, proxies `/api/*` to `http://localhost:8081`
- **nginx:alpine** — production container (port 8082), also proxies `/api/*`
- **MDI icons** — `@mdi/font`, always use `mdi-*` icon names

## File map

```
src/main.js                 Bootstrap: Vuetify + Pinia + App mount
src/App.vue                 Root shell, health check on mount, service banner
src/components/
  TranslateForm.vue         Language selects, word input, context, translate button
  ResultCard.vue            Two WordPanels + notes section
  WordPanel.vue             Pure presentational: word display + POS select + save
  StatusChip.vue            Pure presentational: database status chip
src/services/api.js         All fetch calls, error normalisation
src/stores/translate.js     All state + async actions
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
  object  → found record (Save button disabled, shows "Saved ✓")
```

### API proxy

All requests use the `/api` prefix. Both Vite (dev) and nginx (prod) strip it
before forwarding to the translation service. Never hardcode port 8081 in Vue code.

## Code quality tools (recommended additions)

### ESLint + Prettier

```bash
npm install -D eslint eslint-plugin-vue @vue/eslint-config-prettier prettier
```

**`eslint.config.js`**

```js
import pluginVue from 'eslint-plugin-vue'
import prettierConfig from '@vue/eslint-config-prettier'

export default [
  {
    files: ['**/*.{js,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  ...pluginVue.configs['flat/recommended'],
  prettierConfig,
  {
    rules: {
      'vue/multi-word-component-names': 'off',  // StatusChip etc. are fine
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
]
```

**`.prettierrc.json`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Add to `package.json` scripts:**

```json
"lint": "eslint src --ext .js,.vue",
"format": "prettier --write src"
```

### Why these tools, not others

| Tool | Reason |
|---|---|
| `eslint-plugin-vue` | Catches Vue-specific issues: missing `key` on `v-for`, invalid prop definitions, unused `defineEmits` |
| `@vue/eslint-config-prettier` | Disables ESLint formatting rules that conflict with Prettier |
| Prettier | Enforces consistent formatting without debate — matches the style already in use (no semis, single quotes) |
| Not Stylelint | No `.css`/`.scss` files — Vuetify utility classes only |
| Not TypeScript / vue-tsc | Not yet — the project is plain JS; add if the team wants it |

## Constraints

- No Options API anywhere
- No direct `fetch` calls outside `src/services/api.js`
- No business logic in components — it goes in the store
- No custom CSS when a Vuetify utility class covers the need
- `.env` is gitignored — document new variables in `.env.example` instead
- The translation service is **not** in `docker-compose.yml` — it runs independently on port 8081
- `saveWord` and `savePhrase` always send `source_name: 'vocab-app'` and `is_verified: false`
- `POST /search` returns substring matches — always filter with `findExactMatch()` client-side
