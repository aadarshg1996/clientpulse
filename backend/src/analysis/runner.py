"""Run the analyst agent for one account and persist its output (synchronous)."""

from __future__ import annotations

import datetime

from agents import Runner, gen_trace_id, trace
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from ..agents.analyst import build_analyst
from ..agents.guardrails import check_and_repair
from ..agents.schemas import AnalysisResult
from ..llm import config
from ..models import (
    Account,
    Action,
    AnalysisRun,
    Document,
    HealthScore,
    Signal,
    SlaMetric,
)


def _account_facts(session: Session, account: Account) -> str:
    today = datetime.date.today()
    renew_days = (account.renewal_dt - today).days if account.renewal_dt else None
    sla = list(session.scalars(
        select(SlaMetric).where(SlaMetric.account_uid == account.account_uid)
        .order_by(SlaMetric.period_month)
    ))
    sla_lines = "\n".join(
        f"  - {s.period_month:%b %Y}: actual {float(s.actual_pct):.0f}% "
        f"(target {float(s.target_pct):.0f}%){' BREACH' if s.breached else ''}"
        for s in sla
    ) or "  (no SLA data on file)"
    renewal = f"{account.renewal_dt}" + (f" ({renew_days} days away)" if renew_days is not None else "")
    return (
        f"Account: {account.name} ({account.account_uid})\n"
        f"Segment: {account.segment} · Owner: {account.owner}\n"
        f"ARR: ${float(account.arr):,.0f} · Term: {account.contract_term_months} months\n"
        f"Contract start: {account.contract_start_dt} · Renewal: {renewal}\n"
        f"Monthly SLA attainment:\n{sla_lines}"
    )


def _ground_signal(uid: str, vid: str, query: str, filenames: dict[str, str]) -> dict:
    """Search the vector store for the chunk that best supports a signal.

    Returns the real source file + quoted snippet so citations are verifiable
    (not just what the model claimed). Best-effort: returns {} on any failure.
    """
    try:
        res = config.client().vector_stores.search(
            vector_store_id=vid,
            query=query,
            max_num_results=1,
            filters={"type": "eq", "key": "account_uid", "value": uid},
        )
    except Exception:  # noqa: BLE001 — citations are best-effort
        return {}
    data = getattr(res, "data", None) or []
    if not data:
        return {}
    top = data[0]
    file_id = getattr(top, "file_id", None)
    # content is a list of {type, text}; take the first text block, trimmed
    quote = ""
    for part in getattr(top, "content", []) or []:
        text = getattr(part, "text", None)
        if text:
            quote = text.strip().replace("\n", " ")[:280]
            break
    return {
        "source_file": filenames.get(file_id) or getattr(top, "filename", None),
        "source_file_id": file_id,
        "source_quote": quote or None,
    }


def _band(v: int) -> str:
    return "healthy" if v >= 80 else "watch" if v >= 65 else "risk" if v >= 50 else "critical"


def make_history(score: int, trend_dir: str | None, weeks: int = 24) -> list[int]:
    """An illustrative weekly lead-up ending at the current score, shaped by trend."""
    import math
    span = 16 if trend_dir == "down" else -14 if trend_dir == "up" else 3
    start = score + span
    out = []
    for i in range(weeks):
        f = i / (weeks - 1)
        out.append(max(5, min(100, round(start + (score - start) * f + math.sin(i * 1.5 + score) * 1.4))))
    out[0] = max(5, min(100, start))
    out[-1] = score
    return out


def _due_date(due_label: str | None, today: datetime.date) -> datetime.date | None:
    """Turn a human due window ('3 days', '2 weeks', '1 month') into a real date."""
    if not due_label:
        return None
    import re
    m = re.search(r"(\d+)\s*(day|week|month)", due_label.lower())
    if not m:
        return None
    n, unit = int(m.group(1)), m.group(2)
    days = n * {"day": 1, "week": 7, "month": 30}[unit]
    return today + datetime.timedelta(days=days)


def prior_feedback(session: Session, account_uid: str) -> dict[str, str]:
    """Map signal label -> feedback for the account's current signals (survives re-analysis)."""
    return {
        s.label: s.feedback
        for s in session.scalars(select(Signal).where(Signal.account_uid == account_uid))
        if s.feedback
    }


def _persist(session: Session, account: Account, result: AnalysisResult, vid: str) -> None:
    uid = account.account_uid
    today = datetime.date.today()
    # preserve manager feedback across re-analysis (matched by signal label)
    carried = prior_feedback(session, uid)
    # overwrite prior agent output for this account
    session.execute(delete(HealthScore).where(HealthScore.account_uid == uid))
    session.execute(delete(Signal).where(Signal.account_uid == uid))
    session.execute(delete(Action).where(Action.account_uid == uid))

    # write a short weekly history (ending today) so the trend chart has a curve
    hist = make_history(result.health_score, result.trend_dir)
    n = len(hist)
    for i, v in enumerate(hist):
        session.add(HealthScore(
            account_uid=uid,
            snapshot_dt=today - datetime.timedelta(weeks=n - 1 - i),
            score=v,
            status=result.status if i == n - 1 else _band(v),
            trend_dir=result.trend_dir,
            confidence=result.confidence,
        ))

    # map openai file_id -> filename for human-readable citations
    filenames = {
        d.openai_file_id: d.filename
        for d in session.scalars(select(Document).where(Document.account_uid == uid))
        if d.openai_file_id
    }
    for s in result.signals:
        cite = _ground_signal(uid, vid, f"{s.label}. {s.signal_text}", filenames)
        session.add(Signal(
            account_uid=uid, tone=s.tone, label=s.label,
            signal_text=s.signal_text, evidence_ref=s.evidence_ref,
            source_file=cite.get("source_file"),
            source_file_id=cite.get("source_file_id"),
            source_quote=cite.get("source_quote"),
            feedback=carried.get(s.label),  # re-apply prior feedback to a recurring signal
            feedback_at=datetime.datetime.now(datetime.timezone.utc) if carried.get(s.label) else None,
        ))
    for a in result.actions:
        session.add(Action(
            account_uid=uid, priority=a.priority, title=a.title,
            owner=a.owner, due_label=a.due_label, due_date=_due_date(a.due_label, today),
            rationale=getattr(a, "rationale", None),
            expected_impact=getattr(a, "expected_impact", None),
            linked_signal=getattr(a, "linked_signal", None),
            status="recommended",
        ))
    account.sentiment = result.sentiment


def analyze_account(session: Session, account_uid: str) -> dict:
    account = session.scalar(select(Account).where(Account.account_uid == account_uid))
    if account is None:
        raise ValueError(f"Unknown account: {account_uid}")

    doc_count = session.scalar(
        select(func.count()).select_from(Document).where(Document.account_uid == account_uid)
    )
    if not doc_count:
        # auto-ingest if the account has documents on disk but they're not synced yet
        from ..ingestion.vector_store import DATA_ROOT, ingest_account
        if (DATA_ROOT / account_uid).is_dir():
            ingest_account(session, account_uid)
        else:
            raise RuntimeError(f"{account_uid} has no documents — upload some first")

    vid = config.vector_store_id()
    if not vid:
        raise RuntimeError("No vector store configured — ingest documents first")

    trace_id = gen_trace_id()
    run = AnalysisRun(
        account_uid=account_uid, status="running", model=config.model(), trace_id=trace_id
    )
    session.add(run)
    session.commit()

    try:
        facts = _account_facts(session, account)
        if config.multi_agent():
            from ..agents.specialists import build_orchestrator
            agent = build_orchestrator(account_uid, vid, facts)
        else:
            agent = build_analyst(account_uid, vid)

        # feed prior manager feedback back into the agent (the learning loop)
        fb = prior_feedback(session, account_uid)
        false_pos = [label for label, v in fb.items() if v == "false_positive"]
        confirmed = [label for label, v in fb.items() if v == "confirmed"]
        feedback_note = ""
        if false_pos:
            feedback_note += (
                "\n\nManager review — these signals were previously marked FALSE POSITIVE. "
                "Do NOT raise them again unless you find new, stronger evidence: "
                + "; ".join(false_pos)
            )
        if confirmed:
            feedback_note += (
                "\n\nManager review — these signals were previously CONFIRMED as valid: "
                + "; ".join(confirmed)
            )

        prompt = (
            f"Analyze this account and return the structured assessment.\n\n"
            f"Tabular facts (ground truth):\n{facts}\n\n"
            f"Now use File Search to read this account's documents and ground your "
            f"signals with citations."
            f"{feedback_note}"
        )
        # one trace per analysis, grouped by account, visible in OpenAI Traces
        with trace("clientpulse analyze", trace_id=trace_id, group_id=account_uid,
                   metadata={"account_uid": account_uid}):
            result = Runner.run_sync(agent, prompt)
        output: AnalysisResult = result.final_output

        # output guardrail — repair deterministic violations, record flags
        doc_types = {
            d.doc_type
            for d in session.scalars(select(Document).where(Document.account_uid == account_uid))
            if d.doc_type
        }
        flags = check_and_repair(output, doc_types_present=doc_types)
        run.guardrail_flags = "; ".join(flags) if flags else None

        _persist(session, account, output, vid)
        session.flush()

        # LLM-judge eval over the persisted signals + their real cited quotes
        if config.eval_on():
            from ..agents.judge import evaluate
            persisted = list(session.scalars(select(Signal).where(Signal.account_uid == account_uid)))
            try:
                jr = evaluate(account.name, output.health_score, output.status, output.confidence, persisted)
                run.eval_score = jr.overall
                run.eval_json = jr.model_dump_json()
            except Exception:  # noqa: BLE001 — eval is best-effort, never blocks analysis
                pass

        run.status = "analyzed"
        run.finished_at = func.now()
        session.commit()
        return {
            "account_uid": account_uid,
            "run_id": run.id,
            "trace_id": trace_id,
            "guardrail_flags": run.guardrail_flags,
            "status": "analyzed",
            "health_score": output.health_score,
            "health_status": output.status,
            "confidence": output.confidence,
            "sentiment": output.sentiment,
            "signals": len(output.signals),
            "actions": len(output.actions),
            "summary": output.summary,
        }
    except Exception as exc:  # noqa: BLE001 — record failure, surface to caller
        session.rollback()
        run = session.scalar(select(AnalysisRun).where(AnalysisRun.id == run.id))
        if run:
            run.status = "failed"
            run.error = str(exc)[:2000]
            run.finished_at = func.now()
            session.commit()
        raise
