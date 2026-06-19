# Vocabulary App

A local-first Vue 3 + Vuetify application for translating words and
phrases via the translation service API. Translate a word or phrase, review the
result with linguistic enrichment (part of speech, root word, notes), and save
to your database with a single click.

## Prerequisites

- **Docker Desktop** — for running the containerized app (`make build && make up`)
- **Node.js 20+** — only needed for local development (`make dev`) and running tests
- **Translation service** — must be running on port 8081 before using the app

## Node.js Installation (for `make dev` and `make test` only)

If Node.js is not installed, `make dev` will print a helpful error. To install:

- **Recommended**: use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager)
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  nvm install 20
  nvm use 20
  ```
- **Alternative**: download directly from [nodejs.org](https://nodejs.org)

## Quick Start (Docker)

```bash
make build
make up
```

Open [http://localhost:8082](http://localhost:8082).

The translation service must be running on port 8081 first. If it is not, the
app will show a warning banner.

## Development Mode

Runs the Vite dev server with hot reload. Requires Node 20+ and the translation
service running on port 8081.

```bash
make dev
```

Open [http://localhost:5173](http://localhost:5173).

## Running Tests

```bash
make test        # run all tests once
npm run test:watch   # re-run on file changes during development
```

71 tests covering the Pinia store (all actions and state transitions) and
components (WordPanel, StatusChip, ResultCard).

## Configuration

Copy `.env.example` to `.env` and adjust as needed:

```
VITE_API_BASE_URL=http://localhost:8081       # translation service URL
VITE_DEFAULT_SOURCE_LANG=hu                  # initial source language (first load only)
VITE_DEFAULT_TARGET_LANG=en                  # initial target language (first load only)
VITE_SOURCE_NAME=vocab-app                   # tag applied to saved words/phrases
VITE_SPACE_INDICATES_PHRASE=true             # treat spaced input as a phrase
```

**Language selections** are remembered between sessions. The defaults only apply
on the very first load — after that, localStorage takes over.

**`VITE_SPACE_INDICATES_PHRASE`** — when `true` (the default), any input
containing a space is treated as a phrase rather than a word. For phrases: the
root word and part-of-speech panels are hidden, and the result is saved via
`POST /phrases` instead of `POST /words`. Set to `false` to disable this
behaviour.

## Translation Service Dependency

This app communicates with the translation service at `http://localhost:8081`.
The service must be running before using the app. If it is unreachable, a warning
banner appears at the top of the page.

To start the translation service (https://github.com/noxpert/translation-service).
See its own `README.md` and run `make up` in the `translation-service` directory.

## Makefile Targets

| Command | Description |
|---------|-------------|
| `make build` | Build the Docker image |
| `make up` | Start the app in the background (port 8082) |
| `make down` | Stop the app |
| `make restart` | Restart the app container |
| `make logs` | Tail app logs |
| `make dev` | Run Vite dev server locally (requires Node 20+) |
| `make lint` | Run ESLint + Prettier checks |
| `make test` | Run Vitest unit tests |
| `make shell` | Shell into the running container |
| `make clean` | Remove image and rebuild from scratch |
| `make help` | Show available targets |

## Project Structure

```
vocab-app/
├── src/
│   ├── main.js               # Vue entry, Vuetify + Pinia setup
│   ├── App.vue               # Root layout, health check banner
│   ├── components/
│   │   ├── TranslateForm.vue # Input card
│   │   ├── ResultCard.vue    # Translation result display
│   │   ├── WordPanel.vue     # Word/phrase panel with save
│   │   └── StatusChip.vue    # Database status indicator
│   ├── services/
│   │   └── api.js            # All API calls
│   └── stores/
│       └── translate.js      # Pinia store (state + actions)
├── tests/
│   ├── setup.js              # Vitest global setup (Vuetify, browser API mocks)
│   ├── stores/
│   │   └── translate.test.js
│   └── components/
│       ├── StatusChip.test.js
│       ├── WordPanel.test.js
│       └── ResultCard.test.js
├── .github/
│   └── workflows/
│       └── ci.yml            # Lint, test, and build on every PR and push to main
├── Dockerfile                # Multi-stage: Node build → nginx serve
├── docker-compose.yml        # vocab-app only; translation service is external
├── nginx.conf                # Static file serving + /api proxy
└── Makefile
```
