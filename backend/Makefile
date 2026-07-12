.PHONY: install-deps create-db db-diff db-apply seed seed-docs reseed api test help populate

# Load .env so DATABASE_URL / POSTGRES_* are available to db targets.
ifneq (,$(wildcard .env))
include .env
export
endif

# Atlas wants the postgres:// scheme + sslmode for local (no TLS).
ATLAS_URL ?= postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB)?sslmode=disable
# Scratch database Atlas uses to normalize the desired schema.
ATLAS_DEV_URL ?= postgres://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@$(POSTGRES_HOST):$(POSTGRES_PORT)/clientpulse_atlas_dev?sslmode=disable

help:
	@echo "Available targets:"
	@echo "  make install-deps - Create venv and install with uv sync"
	@echo "  make create-db    - Create the Postgres database(s) (idempotent)"
	@echo "  make db-diff      - Show the Atlas plan (dry run) for schema.sql"
	@echo "  make db-apply     - Apply schema.sql to the database via Atlas"
	@echo "  make seed         - Generate synthetic data (ACCOUNTS=30 default)"
	@echo "  make api          - Run the FastAPI development server"
	@echo "  make test         - Run backend tests"
	@echo "  make reseed       - db-apply then seed (fresh dummy DB)"

install-deps:
	@test -d .venv || uv venv --python 3.13
	uv sync
	@echo "Done. Activate with: source .venv/bin/activate"

create-db:
	bash scripts/create_db.sh
	@POSTGRES_DB=clientpulse_atlas_dev bash scripts/create_db.sh

db-diff: create-db
	atlas schema diff --to "file://schema.sql" --from "$(ATLAS_URL)" --dev-url "$(ATLAS_DEV_URL)"

db-apply: create-db
	atlas schema apply --url "$(ATLAS_URL)" --to "file://schema.sql" --dev-url "$(ATLAS_DEV_URL)" --auto-approve

ACCOUNTS ?= 30
seed:
	uv run python -m src.seed --accounts $(ACCOUNTS)

DOC_ACCOUNTS ?= 6
seed-docs:
	uv run python -m src.seed_docs --accounts $(DOC_ACCOUNTS)

reseed: db-apply seed

POPULATE_ACCOUNTS ?= 30
# One-time agent populate (docs -> ingest+analyze -> trend). Point DATABASE_URL
# at the target (e.g. Render EXTERNAL url) and set OPENAI_API_KEY. Costs OpenAI.
populate:
	uv run python -m src.populate --accounts $(POPULATE_ACCOUNTS)

api:
	uv run uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

test:
	uv run pytest
