"""Evaluate the latest analysis for an account with the LLM judge."""

from __future__ import annotations

import datetime
import json

from agents import Runner, gen_trace_id, trace
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..agents.judge import JudgeResult, build_judge
from ..models import Account, AnalysisRun, HealthScore, Signal


def _evidence_block(session: Session, account_uid: str) -> str:
    latest = session.scalars(
        select(HealthScore).where(HealthScore.account_uid == account_uid)
        .order_by(HealthScore.snapshot_dt.desc())
    ).first()
    signals = list(session.scalars(select(Signal).where(Signal.account_uid == account_uid)))
    head = (
        f"Score: {latest.score if latest else '?'} · status: {latest.status if latest else '?'} "
        f"· confidence: {latest.confidence if latest else '?'}\n\nSignals:\n"
    )
    lines = []
    for s in signals:
        lines.append(
            f"- [{s.tone}] {s.label}: {s.signal_text}\n"
            f"    cited: {s.evidence_ref or 'none'} | source: {s.source_file or 'none'}\n"
            f"    quote: \"{(s.source_quote or '').strip()[:240]}\""
        )
    return head + "\n".join(lines)


def evaluate_account(session: Session, account_uid: str) -> dict:
    account = session.scalar(select(Account).where(Account.account_uid == account_uid))
    if account is None:
        raise ValueError(f"Unknown account: {account_uid}")
    run = session.scalars(
        select(AnalysisRun).where(AnalysisRun.account_uid == account_uid).order_by(AnalysisRun.id.desc())
    ).first()
    if run is None:
        raise RuntimeError(f"{account_uid} has not been analyzed yet")

    evidence = _evidence_block(session, account_uid)
    judge = build_judge()
    prompt = f"Review this account-health analysis.\n\n{evidence}"

    tid = gen_trace_id()
    with trace("clientpulse eval", trace_id=tid, group_id=account_uid):
        result = Runner.run_sync(judge, prompt)
    verdict: JudgeResult = result.final_output

    run.eval_score = verdict.overall
    run.eval_json = verdict.model_dump_json()
    run.updated_at = datetime.datetime.now(datetime.timezone.utc)
    session.commit()

    return {
        "account_uid": account_uid,
        "run_id": run.id,
        "eval_score": verdict.overall,
        "grounding": verdict.grounding,
        "hallucination_free": verdict.hallucination_free,
        "rubric_adherence": verdict.rubric_adherence,
        "completeness": verdict.completeness,
        "verdict": verdict.verdict,
        "issues": verdict.issues,
    }
