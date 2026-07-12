"""Multi-agent analysis: an orchestrator that consults specialist agents.

Pattern: agents-as-tools. Each specialist is an Agent with its own File Search
(account-filtered) and a focused lens; the orchestrator calls them as tools, then
synthesizes their findings into the final AnalysisResult. One trace, with a
sub-span per specialist — visible in OpenAI Traces.
"""

from __future__ import annotations

from agents import Agent, FileSearchTool
from pydantic import BaseModel, Field

from ..llm import config
from .schemas import AnalysisResult, AnalysisSignal


class SpecialistFinding(BaseModel):
    focus: str = Field(description="the lens, e.g. 'contract risk'")
    signals: list[AnalysisSignal] = Field(description="evidence-cited findings for this lens")
    lens_score: int = Field(ge=0, le=100, description="account health from this lens only")
    missing_evidence: list[str] = Field(
        default_factory=list, description="doc types / facts that were absent for this lens"
    )
    notes: str = Field(description="one-line summary for the orchestrator")


def _file_search(uid: str, vid: str, n: int = 4) -> FileSearchTool:
    return FileSearchTool(
        vector_store_ids=[vid],
        max_num_results=n,
        filters={"type": "eq", "key": "account_uid", "value": uid},
    )


# lens key, display name, tool description, focused instructions
SPECIALISTS: list[tuple[str, str, str, str]] = [
    (
        "contract_risk",
        "Contract Risk analyst",
        "Assess contract and commercial risk (penalties, auto-renewal, liability, scope).",
        "You assess CONTRACT risk only. Use File Search to read the MSA/contract and SOW. "
        "IMPORTANT: standard clauses present in essentially every contract — a normal liability "
        "cap, routine acceptance terms, a standard auto-renewal provision — are NOT risks. Do not "
        "flag them as warn/critical. Only raise a risk when a term is actually UNFAVOURABLE or "
        "TRIGGERED: e.g. an active penalty/credit owed because of a real SLA breach, a near-term "
        "renewal that does NOT auto-renew, or an atypically low liability cap. If the contract is "
        "standard with no triggered exposure, return 'good'/neutral signals and a HIGH lens_score "
        "(85-95). Cite the clause (e.g. 'Contract MSA · §7.2').",
    ),
    (
        "sla_health",
        "SLA & Delivery Health analyst",
        "Assess SLA attainment and delivery health from the SLA schedule and status updates.",
        "You assess SLA and delivery health only. Use the tabular SLA facts in your context plus "
        "File Search over the SLA schedule and weekly status. Flag breaches vs the 95% target and "
        "delivery RAG signals. Cite 'SLA schedule' or 'Weekly status'.",
    ),
    (
        "renewal",
        "Commercial & Renewal analyst",
        "Assess renewal exposure and commercial risk from term, ARR and renewal date.",
        "You assess renewal and commercial exposure only. Weigh renewal proximity (days to renewal), "
        "ARR at stake, and auto-renewal posture from the contract. Flag near-term renewals lacking a "
        "proposal. Cite 'Contract MSA · §18' or the renewal facts.",
    ),
    (
        "sentiment",
        "Client Sentiment analyst",
        "Assess client sentiment from QBR notes and status updates.",
        "You assess client SENTIMENT only. Use File Search over QBR notes and weekly status. Determine "
        "Positive / Neutral / Mixed / Negative and capture escalations. Cite 'QBR notes'. If no "
        "sentiment evidence exists, say so and add it to missing_evidence.",
    ),
    (
        "missing_data",
        "Missing-Data analyst",
        "Identify absent evidence that should lower confidence.",
        "You assess EVIDENCE COMPLETENESS only. The expected documents are contract, SOW, SLA schedule, "
        "weekly status, QBR notes. Use File Search to see what is retrievable; list any expected doc type "
        "that is absent in missing_evidence. Missing data is NOT good news — it lowers confidence.",
    ),
]


def _facts_block(facts: str) -> str:
    return f"\n\nAccount context (ground truth):\n{facts}\n"


def _build_specialist(uid: str, vid: str, instr: str, name: str, facts: str) -> Agent:
    return Agent(
        name=name,
        model=config.model_mini(),
        instructions=instr + _facts_block(facts) +
        "\nReturn 1-4 signals for your lens, a lens_score (0-100), and missing_evidence.",
        output_type=SpecialistFinding,
        tools=[_file_search(uid, vid)],
    )


ORCHESTRATOR_INSTRUCTIONS = """\
You are the ClientPulse orchestrator. Assess one client account by consulting your
specialist tools, then synthesizing one assessment.

Process:
1. Call EVERY specialist tool exactly once: contract_risk, sla_health, renewal, sentiment, missing_data.
2. Merge their signals (drop near-duplicates), keeping each signal's evidence_ref.
3. health_score 0-100 — bands: >=80 healthy, 65-79 watch, 50-64 risk, <50 critical.
   CALIBRATION — anchor on the strongest evidence, do not be reflexively pessimistic:
   - A healthy account = SLA consistently >=95%, positive/neutral sentiment, renewal >90 days away,
     and no TRIGGERED contract risk → score 82-92. Standard contract clauses alone must NOT pull a
     strong account below healthy.
   - watch = mostly fine with a minor issue; risk = a real problem (some breaches, mixed sentiment,
     renewal 45-90d); critical = sustained breaches, negative sentiment, or renewal <45d.
   Only lower a score for MATERIAL, evidence-backed problems — not for routine contract boilerplate.
4. confidence — start ~90 and SUBTRACT for each item the missing_data specialist reports. Missing
   data is not good news.
5. sentiment — take it from the sentiment specialist.
6. actions — 1-4 recommended next actions tied to the top risks; all pending human review.
Return the final AnalysisResult. Keep everything specific to THIS account and evidence-grounded.
"""


def build_orchestrator(account_uid: str, vid: str, facts: str) -> Agent:
    tools = []
    for key, name, desc, instr in SPECIALISTS:
        specialist = _build_specialist(account_uid, vid, instr, name, facts)
        tools.append(specialist.as_tool(tool_name=key, tool_description=desc))
    return Agent(
        name="ClientPulse Orchestrator",
        model=config.model(),
        instructions=ORCHESTRATOR_INSTRUCTIONS,
        output_type=AnalysisResult,
        tools=tools,
    )
