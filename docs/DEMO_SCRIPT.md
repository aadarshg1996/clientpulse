# ClientPulse — 5-minute demo script

## Pre-demo checklist
- [ ] **Live app open:** https://clientpulse-web-4t8u.onrender.com (hosted on Render — no local setup)
- [ ] **Warm the backend first** — hit the app ~1 min before demo so the free-tier backend is awake (cold start ~30–60s). Confirm the portfolio loads with data.
- [ ] All 30 accounts already analyzed (multi-agent + actions + eval) — done, live in the DB. Never run analysis live on stage.
- [ ] One **real** contract PDF on the desktop for the upload demo
- [ ] OpenAI Traces tab open (platform.openai.com/traces) to show specialist sub-spans
- [ ] Do NOT click Re-analyze on stage (15-90s + nondeterministic) — use the pre-baked data
- [ ] Backup: if the network/site is flaky, run locally (`cd backend && make api` + `cd frontend && npm run dev`)

## The flow (≈5 min)

**1. The problem (30s)**
"An HCL delivery manager runs 20-30 client accounts. Risk — SLA breaches, renewal exposure,
souring sentiment — is buried across contracts, SLA reports, QBR notes, and surfaces late,
after a client escalates. ClientPulse reads that evidence and flags risk proactively."

**2. Portfolio (45s)** — open the dashboard.
"30 accounts, each scored by the agent. KPIs: portfolio health, ARR at risk, accounts at risk.
The donut and bubble chart show the spread. Everything here came from the agent reading documents —
nothing is hand-entered."

**3. Open an at-risk account (90s)** — open a Critical account.
- Point at **health gauge, SLA bars, renewal countdown** (real, from docs + tabular).
- **Signals detected** — "each is cited to the actual document, with the quoted clause" → expand
  one (e.g. SLA breach → sla_schedule.pdf quote, or MSA §7.2). "Click the source — it's the real text,
  not something the model made up."
- **Recommended actions** — "each has a rationale, expected impact ('protects $2.3M renewal'), a real
  due date, and links back to the signal it addresses. The manager approves or dismisses — nothing is
  auto-sent to the client."

**4. Responsible AI (45s)**
- **Analysis quality 40/100** badge — "the system grades itself with an LLM judge. It's honest — it
  flags where evidence is thin. That's the point: we measure and we don't over-trust."
- **Signal feedback** — mark one False positive. "Manager corrections feed back into the next analysis —
  the agent stops re-raising rejected findings."

**5. Chatbot (45s)** — in the drawer, ask "What's the renewal exposure?"
"Grounded Q&A over the same evidence — cites the documents, and even catches a data discrepancy
between the contract and the QBR."

**6. Multi-agent proof (30s)** — switch to the Traces tab.
"Under the hood it's five specialist agents — contract risk, SLA/health, renewal, sentiment, missing-data —
orchestrated and synthesized. Here's one run: a sub-span per specialist. Real multi-agent, not a single prompt."

**7. Close (15s)**
"Built on the OpenAI Agents SDK, gpt-5, File Search. Upload-first, no integrations required.
Honest about what it doesn't know. Ready to scale to connectors, auth, and scheduled briefs."

## Judge Q&A — have these ready

**"You're uploading client contracts to OpenAI?"**
"For the prototype, yes — into a per-account-filtered vector store. Production path: enterprise/no-train
data controls, or Azure OpenAI / a private vector store, with PII redaction at ingest. The architecture
isolates each account and keeps a full audit trail."

**"Is this really agentic, or just RAG?"**
"It's a multi-agent system — an orchestrator delegates to five specialist agents, each choosing when to
retrieve via File Search, and a synthesis step combines them. The traces show the specialist calls.
RAG is one tool inside it."

**"Why is the quality score only 40?"**
"Because the judge is strict and honest — it penalizes any claim whose quote doesn't fully support it.
We'd rather show a real 40 and the path to raise it than a flattering 90. The fix is tighter clause-level
retrieval, which is the next iteration."

**"How does it scale / cost?"**
"gpt-5-mini for specialists, gpt-5 for synthesis; per-account caching and model routing are the next step.
Connectors (Jira, ServiceNow, SharePoint, CRM) replace manual upload at enterprise scale."

## Future scope (one slide)
Connectors · auth + RBAC + SSO + audit · multi-tenant · action execution (auto-ticket / approved send) ·
enterprise data governance · portfolio cross-account intelligence · scheduled email/Slack briefs ·
continuous eval with a golden dataset · cloud deploy.
