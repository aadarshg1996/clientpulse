# ClientPulse AI — Hackathon Submission

Copy-paste answers, one section per form field.

---

## Problem this agent is trying to solve

Account and delivery managers run 10–30 client accounts with no single place that tells them which accounts are slipping, whether SLAs or contract obligations are being breached, which renewals are at risk, and what to do about it. That signal lives scattered across contracts, SOWs, SLA reports, weekly status updates, QBR notes, spreadsheets, email, and people's heads. Risk is discovered late — usually after a client escalates or a renewal is already in jeopardy. ClientPulse AI reads the documents managers already have and surfaces **what is at risk, why, and the recommended next action** — each backed by cited evidence and an honest confidence score.

---

## Specific friction a linear program or human can't solve efficiently

- **Unstructured, heterogeneous inputs.** The evidence is prose across PDF/DOCX/PPTX/CSV/XLSX. A deterministic pipeline can't reliably read a QBR note or contract clause and pull out the obligation, the breach, and the sentiment. A human can — but not across 30 accounts, every week, consistently.
- **Cross-document reasoning.** A renewal risk is only visible when you connect a contract term + a declining SLA trend + a negative status update. No single report shows this; a person has to hold it all in their head.
- **Judgment at scale + honesty about gaps.** The hard part isn't the arithmetic — it's narrating *why* something is risky, citing the source, and admitting when data is missing. The agent's key move: **missing data lowers confidence rather than hiding risk** (null ≠ low risk), which a naive dashboard gets wrong by showing green where there's simply no data.

---

## Agent Persona

**"The Portfolio Risk Advisor."** An orchestrator agent that acts like a senior delivery/commercial lead reviewing your account book. It coordinates a team of specialist sub-agents, each an expert lens:

- **Contract Risk Agent** — obligations, SLAs, penalty/termination clauses.
- **Project Health Agent** — delivery trend, scope creep, status tone.
- **SLA Agent** — target vs actual attainment, breach detection.
- **Commercial / Renewal Agent** — renewal proximity, ARR exposure, sentiment.
- **Missing-Data / Action Agent** — flags gaps, sets confidence, writes the recommended action plan.

The persona is deliberately advisory, not autonomous: it *recommends* and requires human approval before anything reaches a client.

---

## Solution Architect — high-level overview of how the agent thinks and acts

**Parse → Retrieve → Reason → Score → Recommend, human-in-the-loop.**

1. Manager uploads documents for an account (or uses seeded demo data).
2. **Ingestion** parses each file, chunks it, embeds it, and indexes it into a vector store.
3. The **orchestrator** dispatches specialist agents. Each retrieves relevant evidence via File Search and calls **deterministic tools** for the numeric backbone (SLA compare, scope-creep, risk/confidence scoring).
4. Agents add narrative + citations on top of the deterministic scores — every finding points to a source document/clause.
5. Output: per-account health score (0–100), status band, SLA status, renewal countdown, signals, and a prioritized action plan, each with evidence and a confidence score.
6. Manager works the **Risk Queue** and **approves** actions. Nothing is sent automatically.

Split of labor: deterministic tools own the math (transparent, explainable); agents own the reading, reasoning, and evidence.

---

## The Toolset (APIs / functions the agent can trigger)

- **Deterministic tools:** `sla_compare` (target vs actual per period), `scope_creep` (SOW vs delivered), `risk_score`, `confidence_score` (penalizes missing inputs), `action_plan` (signal → recommended action + owner + due).
- **Retrieval:** OpenAI **File Search** over a per-account vector store for cited evidence.
- **Ingestion parsers:** PyMuPDF (PDF), python-docx (DOCX), python-pptx (PPTX), Pandas (CSV/XLSX).
- **Upload API** (FastAPI): accept files, store, record account/period metadata.
- **Safety checks:** PII detection, prompt-injection check, basic access policy.
- **Agent framework:** OpenAI Agents SDK + Responses API for orchestrator ↔ specialist handoffs and tool calls.

---

## The Technical Stack

| Layer | Choice |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind + shadcn/ui |
| Backend | Python + FastAPI |
| Agents | OpenAI Agents SDK + Responses API |
| Retrieval | OpenAI File Search (vector store) |
| Ingestion | PyMuPDF, python-docx, python-pptx, Pandas |
| Database | Postgres + Ariga Atlas (declarative schema) + SQLAlchemy |
| Storage (MVP) | Local files + Postgres |

---

## Business Impact — value

- **Catch risk early, not post-escalation.** Turns a reactive, after-the-client-complains motion into a proactive weekly review.
- **Zero-integration.** Works from documents managers already have — no Jira/ServiceNow/CRM wiring, so it delivers value on day one where dashboards that assume clean integrated data can't.
- **Trustworthy by design.** Every finding is evidence-cited and confidence-scored; missing data is shown honestly instead of faked green. Human approval keeps managers in control.
- **Portfolio-wide clarity.** One view of health, SLA attainment, renewal risk, and ARR at risk across all accounts.

---

## Business Impact — ROI (quantitative + qualitative)

**Quantitative (illustrative for demo):**

- Manual portfolio review of ~20 accounts (reading contracts/SLAs/QBRs) ≈ 6–10 hrs/week → minutes of review over pre-generated, cited findings. Est. **~80% reduction in review time**.
- Earlier renewal-risk detection protects **ARR at risk** — flagging one at-risk renewal (e.g. a $250K account 45 days out) can pay for the tool many times over.
- **Consistency:** every account scored on the same rules every cycle, vs. uneven human coverage.

**Qualitative:**

- Fewer surprise escalations; better-prepped QBRs.
- Decisions are defensible — findings carry citations and explicit confidence.
- Lower cognitive load; managers focus judgment on approving actions, not hunting for signal.

---

## Future steps — how it scales / grows

- **Web research & external intel:** give the agent internet-search + deep-research tools to look beyond uploaded docs — pull the client's recent news, funding, earnings, leadership changes, hiring signals, and market moves. Enriches risk (e.g. client layoffs → renewal risk) and powers **growth/upsell**: agent reasons over the account + public signals to recommend new services and cross-sell opportunities, each cited to its source.
- **Live integrations** (optional): Jira, ServiceNow, CRM, finance to auto-refresh signals instead of upload-only.
- **Automated (approved) actions:** draft client emails, create tickets, schedule QBRs — still gated by human approval.
- **Churn-prediction ML** layered on top of the deterministic scores.
- **Multi-tenant auth/SSO** for org-wide rollout across many portfolios.
- **Trend/learning loop:** track how approved actions changed outcomes to tune scoring.
- **More specialists:** security/compliance obligations, financial-terms agent, and a **Growth / Opportunity agent** that turns research into recommended next services.

---

## Future steps — who will use this

| Persona | Use |
|---|---|
| Delivery manager | Spot slipping projects and why; get an action plan. |
| Account / client partner | Track renewal risk + sentiment; prep QBRs. |
| PMO / commercial lead | Portfolio-wide risk and ARR-exposure view. |

Primary user (MVP): the **delivery / account manager** running a portfolio of ~10–30 accounts. Scales to PMO and commercial leadership for org-level oversight.

---

## Demo Link

Record a <5 min walkthrough (upload → analysis → portfolio → drawer → action approval on seeded data), upload to SharePoint, set access to **everyone within HCLTech**, paste link here.

> _[paste SharePoint link]_

---

## Access Instructions

> Live prototype:
> - **Frontend:** `cd frontend && npm install && npm run dev` → open `http://localhost:5173`.
> - **Backend:** needs local Postgres; see `backend/README.md`. `make db-apply && make seed && make seed-docs`.
> - Seeded demo data included — no login required (auth is stubbed for MVP).

Adjust to actual deploy.

---

## Live Agent Link

> _[paste hosted URL if deployed — e.g. Vercel frontend + hosted backend. Else: "Local prototype — see Access Instructions."]_
