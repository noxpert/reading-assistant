.PHONY: build up down restart logs dev shell clean lint test help

## Build the Docker image
build:
	docker compose build

## Start the app in the background (port 8082)
up:
	docker compose up -d

## Stop the app
down:
	docker compose down

## Restart the app container
restart:
	docker compose restart vocab-app

## Tail app logs
logs:
	docker compose logs -f vocab-app

## Run Vite dev server locally (requires Node 20+)
dev:
	@command -v node >/dev/null 2>&1 || { echo "Error: Node.js is not installed."; echo "See README.md for installation instructions."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "Error: npm is not installed."; echo "See README.md for installation instructions."; exit 1; }
	npm install && npm run dev

## Open a shell inside the running container
shell:
	docker compose exec vocab-app /bin/sh

## Remove the Docker image and rebuild from scratch
clean:
	docker compose down --rmi local
	docker compose build --no-cache

## Run ESLint and Prettier checks
lint:
	npm run lint
	npm run format:check

## Run Vitest unit tests
test:
	npm test

## Show this help
help:
	@grep -E '^##' Makefile | sed 's/## //'
