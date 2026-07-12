# ClientPulse AI — Product Requirements Document

**Status:** Draft (hackathon MVP)
**Owner:** aadarsh@dyle.io
**Last updated:** 2026-06-22

---

## 1. Summary

ClientPulse AI is an agentic advisor that helps account and delivery managers spot
**contract risk, project health decline, and renewal exposure** across their client
portfolio — and turns that analysis into **recommended, evidence-backed actions**.

Managers upload the documents they already have (contracts, SOWs, SLA reports, weekly
status updates, QBR notes). The system reads them, scores each account, and surfaces
*what is at risk, why, and what to do next* — with citations and a confidence score that
honestly reflects missing data. A human reviews and approves before any action is taken.

---

## 2. Problem

Managers running multiple client accounts have no single place that answers:

- Which accounts are slipping, and why?
- Are we breaching SLAs or contract obligations?
- Which renewals are at risk, and how soon?
- What should I do about it — and what's the evidence?

Today this lives across PDFs, spreadsheets, email, and people's heads. Risk is found
late, usually after a client escalates. Existing dashboards assume clean integrated data
(Jira, ServiceNow, CRM) that most teams don't have wired up.

---

## 3. Goals & non-goals

### Goals (MVP)
- **Upload-first**: works from manager-supplied documents, no integrations required.
- **Portfolio view**: health, SLA, renewal, and ARR-at-risk across all accounts.
- **Account detail**: per-account score, signals, SLA trend, recommended actions, contract context.
- **Risk queue**: a prioritized list of what needs attention now.
- **Evidence + confidence**: every finding cites its source; missing data lowers confidence (null ≠ low risk).
- **Human-in-the-loop**: nothing is sent to a client automatically.

### Non-goals (MVP)
- No live integrations (Jira, ServiceNow, CRM, finance) — optional/future.
- No automatic client emails or ticket creation.
- No legal advice or final contract interpretation.
- No churn-prediction ML model.
- No multi-tenant auth/SSO build-out (stub only).

---

## 4. Users

| Persona | Need |
|---------|------|
| Delivery manager | See which projects are slipping and why; get an action plan. |
| Account / client partner | Track renewal risk and client sentiment; prep for QBRs. |
| PMO / commercial lead | Portfolio-wide view of risk and ARR exposure. |

Primary persona for MVP: **delivery / account manager** working a portfolio of ~10–30 accounts.

---

## 5. Use case / core flow

1. Manager opens ClientPulse → **Portfolio** dashboard.
2. Uploads documents for an account (or uses seeded demo data).
3. System **parses → retrieves → scores**: produces health score, SLA status, renewal
   countdown, signals, and recommended actions, each with evidence + confidence.
4. Manager scans the **portfolio** (KPIs, health trend, distribution, account table).
5. Opens an account → **detail drawer**: gauges, SLA history, signals, actions, contract context.
6. Works the **Risk queue** — prioritized cards (signal → action → confidence) — and approves actions.

---

## 6. Scope — what we build

### 6.1 Frontend (React + Vite + TypeScript)
Implements the approved design (`docs/` dashboard mockups). Two main views + drawer:

**Portfolio view**
- 4 KPI cards: Portfolio Health, Accounts at Risk, ARR at Risk, Avg SLA Attainment (with sparkline + delta).
- Portfolio health trend line (vs target).
- Health distribution donut (Healthy / Watch / At Risk / Critical).
- Account landscape bubble chart (Health × SLA, bubble = ARR).
- Accounts table: search, segment filter, status chips, sortable columns, pagination, sparkline trend.

**Risk queue view**
- Summary bar (open risks, counts by severity, filters).
- Risk cards: signal → recommended action → owner/due → confidence ring → Inspect.

**Account detail drawer**
- Health + renewal gauges, SLA 6-month bars, account-profile radar, health trend.
- Signals detected, recommended actions (review required), contract & context table.

**Global**
- Light/dark theme, accent color, density (cozy/compact), font presets.
- Human-review framing: actions are "recommended", approval required.

### 6.2 Backend (Python + FastAPI) — MVP
- **Upload API**: accept files, store, record metadata (account, period).
- **Ingestion**: parse (PyMuPDF / python-docx / python-pptx / Pandas) → chunk → embed → index.
- **Retrieval**: OpenAI File Search (vector store) for cited evidence.
- **Agents** (OpenAI Agents SDK + Responses API): orchestrator + specialists
  (Contract Risk, Project Health, SLA, Commercial/Renewal, Missing-Data/Action).
- **Deterministic tools**: `sla_compare`, `scope_creep`, `risk_score`, `confidence_score`, `action_plan`.
- **Storage**: SQLite + local files (MVP).
- **Security**: PII check, prompt-injection check, access policy (basic).

### 6.3 Data model (key entities)
- **Account**: name, segment, owner, ARR, contract term/start/renewal, sentiment.
- **Health**: score (0–100), status, trend, confidence.
- **SLA**: target vs actual per period, breach flag.
- **Signal**: tone (critical/warn/good/neutral), label, text, evidence ref.
- **Action**: priority, title, owner, due, status (recommended → approved).
- **Risk**: account, driver signal, recommended action, confidence.

---

## 7. Key requirements

| # | Requirement |
|---|-------------|
| R1 | Manager can upload PDF/DOCX/PPTX/CSV/XLSX for an account. |
| R2 | System produces a health score, SLA status, renewal countdown per account. |
| R3 | Every finding cites its source document/clause. |
| R4 | Confidence score reflects missing data; missing ≠ low risk (shown explicitly). |
| R5 | Portfolio view ranks/filters accounts by status, segment, search. |
| R6 | Risk queue prioritizes accounts and proposes a next action with owner + due. |
| R7 | No outbound client action without explicit human approval. |
| R8 | Works end-to-end on seeded demo data with zero integrations. |

---

## 8. Scoring model (MVP, deterministic)

- **Health score (0–100)** from SLA attainment, trend direction, sentiment, renewal proximity.
- **Status bands**: ≥80 Healthy · 65–79 Watch · 50–64 At Risk · <50 Critical.
- **Confidence**: starts high; each missing input (finance, CSAT, SLA, QBR) reduces it.
- **Signals & actions**: rule-based thresholds (see design logic) — SLA <85 → breach, renewal
  <45d → exposure, trend down → declining health, sentiment negative → escalate.

> Rules are transparent and explainable for the demo. Agents add narrative + evidence on top.

---

## 9. Success criteria (hackathon)

- Demo runs upload → analysis → portfolio → drawer → action approval, on synthetic data.
- At least one account shows a real, evidence-cited risk with a recommended action.
- Missing-data case visibly lowers confidence rather than hiding risk.
- UI matches the approved design across both views + drawer.

---

## 10. Milestones

1. **Skeleton** — repo structure, frontend scaffold, backend stubs. ✅
2. **Synthetic data** — seed 1 project's docs + tabular files (see §6.3).
3. **Frontend** — implement portfolio view, risk queue, drawer (mock data).
4. **Backend** — upload + ingestion + File Search + scoring tools.
5. **Agents** — orchestrator + specialists wired to tools and retrieval.
6. **Integrate** — frontend reads real backend output; demo polish.

---

## 11. Open questions

- Single account at a time, or batch-upload a whole portfolio for the demo?
- How much of the scoring is agent-driven vs deterministic tools for the hackathon?
- Which one synthetic project anchors the demo narrative?
