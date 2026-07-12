# ClientPulse AI

Agentic contract risk, project health, renewal risk, and recommended-action advisor.
Upload-first MVP: managers upload contracts, SOWs, SLA reports, status updates, QBR notes →
system extracts risks, scores confidence, generates an action plan with evidence.

See [docs/PRD.md](docs/PRD.md) for the full product spec.

## Stack

| Layer        | Choice                                            |
|--------------|---------------------------------------------------|
| Frontend     | React + Vite + TypeScript + Tailwind + shadcn/ui  |
| Backend      | Python + FastAPI *(planned)*                       |
| Database     | Postgres + Ariga Atlas (declarative schema) + SQLAlchemy |
| Agents       | OpenAI Agents SDK + Responses API *(planned)*     |
| Retrieval    | OpenAI File Search (vector store) *(planned)*      |
| Ingestion    | PyMuPDF, python-docx, python-pptx, Pandas         |

## Status

| Piece | State |
|-------|-------|
| Project structure | ✅ done |
| PRD | ✅ [docs/PRD.md](docs/PRD.md) |
| Frontend scaffold (Vite + shadcn) | ✅ scaffold only |
| Database schema + synthetic data | ✅ done — see [backend/README.md](backend/README.md) |
| Backend API / agents / ingestion | ⬜ not built yet |
| Frontend ↔ backend wiring | ⬜ not built yet |

## Structure

```
clientpulse/
├── README.md
├── docs/
│   ├── PRD.md                  # product requirements
│   └── *.html                  # architecture diagrams + dashboard design
├── frontend/                   # React + Vite + TS + Tailwind + shadcn/ui scaffold
│   └── src/
│       ├── components/ui/       # shadcn primitives
│       └── lib/
└── backend/                    # Postgres + Atlas + uv (data layer)
    ├── schema.sql              # Atlas declarative schema (source of truth)
    ├── atlas.hcl, Makefile
    ├── scripts/create_db.sh
    ├── src/
    │   ├── db/session.py        # SQLAlchemy engine/session
    │   ├── models/              # SQLAlchemy models (parity with schema.sql)
    │   ├── seed.py              # tabular synthetic data generator
    │   └── seed_docs.py         # textual document generator (PDF/DOCX)
    └── data/synthetic/          # generated demo docs (per account)
```

## Run

### Frontend
```bash
cd frontend && npm install && npm run dev
```

### Backend — database + synthetic data
Needs a local Postgres running. Full details in [backend/README.md](backend/README.md).
```bash
cd backend
cp .env.example .env       # set POSTGRES_* + DATABASE_URL
make install-deps          # uv venv + sync
make db-apply              # create DB + apply schema via Atlas
make seed                  # tabular data (30 accounts)
make seed-docs             # textual docs (6 accounts)
```
