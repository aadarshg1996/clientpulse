# ClientPulse Backend — API, Agents, Database & Synthetic Data

FastAPI service for ClientPulse AI: read API for the dashboard, a multi-agent
analysis pipeline (analyst + specialists + guardrails + LLM judge), document
ingestion into an OpenAI vector store, grounded per-account chat, and synthetic
data generators.

Stack: **FastAPI · Postgres · Ariga Atlas · uv · SQLAlchemy · OpenAI Agents SDK · OpenAI File Search · Faker · reportlab/python-docx**.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python 3.13)
- A running Postgres (local [Postgres.app](https://postgresapp.com/), or hosted e.g. Supabase/Neon)
- [Atlas](https://atlasgo.io/) CLI — `curl -sSf https://atlasgo.sh | sh`
- An **OpenAI API key** (for analyze / chat / evaluate / ingest — the read API works without it)

## Setup

```bash
cd backend
cp .env.example .env        # fill in POSTGRES_* + DATABASE_URL + OPENAI_API_KEY
make install-deps           # uv venv + uv sync
make db-apply               # create DB + apply schema.sql via Atlas
make seed                   # tabular synthetic data (30 accounts)
make seed-docs              # textual synthetic docs (6 accounts)
make api                    # run API at http://localhost:8000
```

## Environment

| Var | Purpose | Default |
|-----|---------|---------|
| `DATABASE_URL` | SQLAlchemy connection string | — (required) |
| `POSTGRES_*` | Used by Atlas / create-db scripts | — |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:5173` |
| `OPENAI_API_KEY` | Required for all agent/chat/eval/ingest endpoints | — |
| `OPENAI_MODEL` | Main reasoning model | `gpt-5` |
| `OPENAI_MODEL_MINI` | Cheaper model for light tasks | `gpt-5-mini` |
| `OPENAI_VECTOR_STORE_ID` | File Search vector store for retrieval; blank = no store | *(empty)* |
| `MULTI_AGENT` | `1` = orchestrator + specialists, `0` = single analyst | `1` |
| `EVAL_ON` | `1` = run LLM judge after each analysis | `1` |

> The read endpoints (`GET /accounts`, `/risks`, etc.) run with just a database.
> The agent endpoints additionally need `OPENAI_API_KEY` (and a vector store for
> document-grounded retrieval).

## API endpoints

**Read (DB only):**
- `GET /accounts` — portfolio summary, KPIs, trend, filters, account rows
- `GET /accounts/{account_uid}` — account drawer detail
- `GET /accounts/{account_uid}/documents` — list ingested documents
- `GET /risks` — prioritized risk / action queue
- `GET /docs` — interactive OpenAPI docs

**Agents & ingestion (need `OPENAI_API_KEY`):**
- `POST /accounts/{account_uid}/documents` — upload a document (multipart)
- `POST /accounts/{account_uid}/ingest` — parse + embed docs into the vector store
- `POST /accounts/{account_uid}/analyze` — run the analyst/specialist agents, persist signals + actions + health
- `POST /accounts/{account_uid}/chat` — grounded Q&A over one account's docs + facts
- `POST /accounts/{account_uid}/evaluate` — LLM judge scores the latest analysis (grounding, hallucination, rubric)

**Human-in-the-loop:**
- `PATCH /actions/{action_id}` — approve / dismiss / reassign a recommended action
- `PATCH /signals/{signal_id}` — mark a signal confirmed / false-positive

## Agent pipeline (`src/agents/`, `src/analysis/`)

`Parse → Retrieve → Reason → Score → Judge`, human-in-the-loop.

- `agents/analyst.py` — analyst agent; orchestrates when `MULTI_AGENT=1`
- `agents/specialists.py` — specialist lenses (contract / health / SLA / renewal / missing-data)
- `agents/guardrails.py` — output validation + repair, PII / prompt-injection checks
- `agents/judge.py` — LLM-judge grounding + hallucination scoring
- `agents/chat.py` / `analysis/chat.py` — grounded per-account chat
- `analysis/runner.py` — runs analyst over one account, persists results
- `analysis/evaluate.py` — runs the judge, persists eval scores
- `ingestion/vector_store.py` — document parse + File Search vector-store upload

Nothing reaches a client automatically — recommended actions require explicit approval via `PATCH /actions/{id}`.

## Make targets

| Target | What it does |
|--------|--------------|
| `make install-deps` | Create venv + `uv sync` |
| `make create-db` | Create `clientpulse` + `clientpulse_atlas_dev` (idempotent) |
| `make db-diff` | Dry-run Atlas plan for `schema.sql` |
| `make db-apply` | Apply `schema.sql` via Atlas (`--auto-approve`) |
| `make seed` | Tabular data — `make seed ACCOUNTS=50` |
| `make seed-docs` | Textual docs — `make seed-docs DOC_ACCOUNTS=10` |
| `make api` | Run API at `http://localhost:8000` |
| `make test` | Run backend test suite |
| `make reseed` | `db-apply` then `seed` (fresh DB) |

## Schema

`schema.sql` is the source of truth (Atlas declarative). Five core tables, all keyed on `account_uid`:

| Table | Purpose | Drives (UI) |
|-------|---------|-------------|
| `accounts` | One row per client account (ARR, segment, owner, term, renewal, sentiment) | KPIs, table, bubble |
| `health_scores` | Weekly health snapshots (score, status, trend, confidence) | trend chart, donut |
| `sla_metrics` | Monthly SLA target vs actual + breach flag | drawer SLA bars |
| `signals` | Detected risk/health signals + tone + evidence ref | drawer signals |
| `actions` | Recommended actions (priority, owner, due, status) | drawer actions, risk queue |

`src/models/*.py` are SQLAlchemy models kept in parity with `schema.sql`.
`analysis_run` records each agent run + eval scores; `document` tracks ingested files.

## Synthetic data

**Tabular — `src/seed.py`** — Faker-driven, deterministic scoring/signal/action
logic. Idempotent (truncates + regenerates). 30 accounts across
healthy/watch/risk/critical, 12-week health history + 6-month SLA per account.

```bash
uv run python -m src.seed --accounts 30 --seed 42
```

**Textual — `src/seed_docs.py`** — reads seeded accounts, writes per-account
document sets to `data/synthetic/<account_uid>/`, content matching the structured data:

- **PDF:** `contract_msa.pdf`, `statement_of_work.pdf`, `sla_schedule.pdf`
- **DOCX:** `weekly_status.docx`, `qbr_notes.docx`

Two accounts get deliberately missing documents to exercise the
"missing data lowers confidence" path.

```bash
uv run python -m src.seed_docs --accounts 6
```

## Layout

```
backend/
├── schema.sql              # Atlas desired-state schema (source of truth)
├── atlas.hcl               # Atlas project config (reads DATABASE_URL)
├── Makefile                # db + seed + api targets
├── pyproject.toml          # uv deps
├── scripts/create_db.sh    # idempotent DB bootstrap
├── src/
│   ├── api/                # FastAPI app, routes, schemas, read services
│   ├── agents/             # analyst, specialists, guardrails, judge, chat, schemas
│   ├── analysis/           # runner, evaluate, chat orchestration
│   ├── ingestion/          # vector_store (parse + File Search upload)
│   ├── llm/config.py       # OpenAI client + model/env config
│   ├── db/session.py       # SQLAlchemy engine/session
│   ├── models/             # SQLAlchemy models (parity with schema.sql)
│   ├── seed.py             # tabular synthetic generator
│   └── seed_docs.py        # textual document generator
└── data/synthetic/         # generated docs (per account_uid)
```

## Deploy (free tier)

Runs as a standard ASGI app:

```bash
uvicorn src.api.main:app --host 0.0.0.0 --port $PORT
```

- **DB:** Supabase / Neon free Postgres → set `DATABASE_URL`.
- **Host:** Render free web service (build `pip install uv && uv sync`, start with the uvicorn command above). Free tier sleeps after 15 min idle → first request cold-starts.
- Set `CORS_ORIGINS` to your deployed frontend URL and `OPENAI_API_KEY` (with a spend cap).
