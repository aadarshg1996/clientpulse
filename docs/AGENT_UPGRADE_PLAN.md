# ClientPulse — Agent Layer Upgrade Plan (consolidated)

Phase-wise plan to evolve the working single-agent core into a grounded,
multi-agent, observable, guarded, self-improving system. Each phase is
independent, shippable, and verified before the next.

**Status:** ✅ done · 🟡 in progress · ⬜ planned (in scope) · 📌 future scope

## Stack (unchanged)
- **Agents:** OpenAI Agents SDK + Responses API + File Search (gpt-5 / gpt-5-mini)
- **Backend:** Python 3.13 · FastAPI · SQLAlchemy 2 · Postgres 18 · Atlas · uv
- **Frontend:** React + Vite + TS + Tailwind v4 + shadcn/ui + ECharts + TanStack Query
- **Eval/observability:** OpenAI tracing + in-app LLM-judge (no MLflow)

---

## Phase 1 — Real citations 🟡
Verifiable sources instead of LLM-stated refs.
- Schema/model: `signals` += `source_file`, `source_file_id`, `source_quote` ✅
- Logic: after analysis, `client.vector_stores.search` per signal (account-filtered) → attach real file + quoted chunk ⬜
- API + frontend: show source chip + quoted span ⬜
- **Verify:** a signal's citation maps to an actual doc + matching quote.

## Phase 2 — Tracing ✅
- `gen_trace_id()` + `trace(...)` around the run, grouped by account; `trace_id` on `analysis_runs`; returned in response. Visible in OpenAI Traces.

## Phase 3 — Output guardrail 🟡
- `agents/guardrails.py` `check_and_repair`: status↔score band, every signal cited, confidence capped when docs missing ✅
- Schema/model: `analysis_runs.guardrail_flags` ✅ (apply pending)
- Wired into runner ✅ · **apply schema + test** ⬜

## Phase 4 — Multi-agent specialists + handoffs ⬜  *(now in scope)*
Replace the single analyst with an orchestrator coordinating focused specialists.

**Design (orchestrator + specialists-as-tools):**
- **Specialist agents** (each: focused instructions + File Search account-filtered, structured partial output):
  - Contract Risk — penalties, auto-renewal, liability, scope (contract/SOW)
  - SLA / Project Health — SLA tabular + status docs
  - Commercial / Renewal — ARR, term, renewal proximity
  - Sentiment — QBR + status updates
  - Missing-Data / Action — gaps → confidence, recommended actions
- **Orchestrator** runs specialists (deterministic fan-out, or as-tools/handoffs), collects findings.
- **Synthesizer** combines into the final `AnalysisResult` (score, status, confidence, signals, actions, sentiment).
- **Tracing**: whole multi-agent run under one trace, a sub-span per specialist.

**Sub-steps:**
1. Specialist partial-output schemas
2. Specialist agents (5)
3. Orchestrator (fan-out + collect)
4. Synthesizer → `AnalysisResult`
5. Wire into runner (behind `MULTI_AGENT` flag; keep single-agent fallback)
6. Verify on one account; compare vs single-agent

**Trade-off:** 5× model calls per account (use gpt-5-mini for specialists, gpt-5 for synthesis). Higher cost/latency — keep the single-agent path as fallback.

## Phase 5 — Action upgrades ⬜
Decision-grade actions.
- Schema: `actions` += `rationale`, `expected_impact`, `linked_signal`, `due_date`
- Each action cites its driver signal + evidence; real due dates from renewal/SLA window
- Frontend: show rationale + impact + linked signal + date
- **Verify:** an action traces to its signal and a real date.

## Phase 6 — Hygiene fixes ⬜
- Vector-store cleanup on re-ingest (delete old files, no duplicate chunks)
- Fix hollow trend (write multiple health snapshots, or hide for agent data)
- Make synthetic docs internally consistent (or intentionally keep one discrepancy, labelled)

## Phase 7 — LLM-judge eval ⬜
- `agents/judge.py` scores grounding / hallucination / rubric / completeness over signals + cited evidence; `eval_score` on `analysis_runs`; quality badge in UI
- **Verify:** degrade prompt → score drops

## Phase 8 — Chatbot ⬜  *(differentiator)*
- Account-scoped grounded Q&A: agent + File Search + Agents SDK sessions; streaming chat endpoint; chat panel in drawer
- **Verify:** ask "why at risk?" → cited answer

## Phase 9 — Demo prep ⬜
Pre-analyze all 30, real PDF on hand, rehearsed script, export architecture SVG.

---

## 📌 Future scope (mention, not built)
Connectors (Jira/ServiceNow/SharePoint/CRM/finance) · Auth + RBAC + SSO + audit · multi-tenant ·
action execution integrations (auto-ticket, auto-send) · enterprise data governance (private/Azure
vector store, PII redaction, no-train, on-prem) · portfolio cross-account intelligence · continuous
eval / golden dataset · cost controls at scale (routing/caching/batching) · scheduled email/Slack
digests (full scheduler) · cloud deploy / live link.

## Execution order
3 (finish) → 1 → **4 (specialists)** → 5 → 6 → 7 → 8 → 9.
