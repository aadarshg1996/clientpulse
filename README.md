# ClientPulse AI

Agentic contract risk, project health, renewal risk, and recommended-action advisor.
Upload-first MVP: managers upload contracts, SOWs, SLA reports, status updates, QBR notes →
system extracts risks, scores confidence, generates an action plan with evidence.

See [docs/PRD.md](docs/PRD.md) for the full product spec.

## 🚀 Live Demo

| | |
|---|---|
| **Live app (start here)** | **https://clientpulse-web-4t8u.onrender.com** |
| Backend API | https://clientpulse-api-vh7g.onrender.com |
| Hosting | Render (frontend static site · FastAPI web service · Postgres) |

### Access instructions

No login or credentials required — the app is public and pre-loaded with 30
demo client accounts.

1. Open **https://clientpulse-web-4t8u.onrender.com** in any browser.
2. The **Portfolio** view loads: 30 accounts with AI-generated health scores,
   risk statuses (healthy / watch / risk / critical), SLA attainment, ARR at
   risk, and a health-trend chart.
3. Open the **Risk queue** to see accounts ranked by risk with the signals and
   recommended actions the agent produced.
4. Click any account to open its **detail** view: contract facts, evidence-cited
   signals, health trend, and recommended actions.
5. In an account, use the **Chat** box to ask grounded questions
   (e.g. *"What are the main risks for this account?"*). Answers cite the
   account's underlying documents (MSA, SOW, SLA schedule, QBR notes) via OpenAI
   File Search.

> Note: the backend runs on Render's free tier, so the first request after a
> period of inactivity may take ~30–60s to wake (cold start). Subsequent
> requests are fast.

## Stack

| Layer        | Choice                                            |
|--------------|---------------------------------------------------|
| Frontend     | React + Vite + TypeScript + Tailwind + shadcn/ui  |
| Backend      | Python + FastAPI *(planned)*                       |
| Database     | Postgres + Ariga Atlas (declarative schema) + SQLAlchemy |
| Agents       | OpenAI Agents SDK + Responses API                 |
| Retrieval    | OpenAI File Search (vector store)                 |
| Ingestion    | PyMuPDF, python-docx, python-pptx, Pandas         |
| Hosting      | Render (static site + web service + Postgres)     |

## Status

| Piece | State |
|-------|-------|
| PRD | ✅ [docs/PRD.md](docs/PRD.md) |
| Frontend (Vite + shadcn) | ✅ built |
| Database schema + synthetic data | ✅ done — see [backend/README.md](backend/README.md) |
| Backend API / agents / ingestion | ✅ built |
| Frontend ↔ backend wiring | ✅ built |
| **Deployed (Render) + populated** | ✅ **live** — see [Live Demo](#-live-demo) |

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
