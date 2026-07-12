"""Read models and portfolio calculations used by the HTTP routes."""

from __future__ import annotations

import datetime
from collections import defaultdict
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

import json

from ..models import Account, Action, AnalysisRun, Document, HealthScore, Signal, SlaMetric


def update_signal_feedback(session: Session, signal_id: int, *, feedback: str | None) -> dict | None:
    signal = session.scalar(select(Signal).where(Signal.id == signal_id))
    if signal is None:
        return None
    signal.feedback = feedback
    signal.feedback_at = datetime.datetime.now(datetime.timezone.utc) if feedback else None
    session.commit()
    return {"id": signal.id, "feedback": signal.feedback}


def update_action_status(
    session: Session,
    action_id: int,
    *,
    status: str,
    owner: str | None = None,
    due_label: str | None = None,
) -> dict | None:
    action = session.scalar(select(Action).where(Action.id == action_id))
    if action is None:
        return None
    action.status = status
    if owner is not None:
        action.owner = owner
    if due_label is not None:
        action.due_label = due_label
    session.commit()
    return {
        "id": action.id,
        "status": action.status,
        "owner": action.owner,
        "due_label": action.due_label,
    }


def list_documents(session: Session, account_uid: str) -> list[dict]:
    rows = session.scalars(
        select(Document).where(Document.account_uid == account_uid).order_by(Document.filename)
    )
    return [{"filename": d.filename, "doc_type": d.doc_type} for d in rows]

STATUS_RANK = {"critical": 0, "risk": 1, "watch": 2, "healthy": 3}
SIGNAL_RANK = {"critical": 0, "warn": 1, "neutral": 2, "good": 3}
ACTION_RANK = {"High": 0, "Medium": 1, "Low": 2}
AT_RISK_STATUSES = {"risk", "critical"}


def _number(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


def _renewal_days(value: datetime.date | None, today: datetime.date) -> int | None:
    return (value - today).days if value else None


def _load_portfolio(session: Session):
    accounts = list(session.scalars(select(Account).order_by(Account.name)))
    health = list(
        session.scalars(
            select(HealthScore).order_by(
                HealthScore.account_uid, HealthScore.snapshot_dt
            )
        )
    )
    sla = list(
        session.scalars(
            select(SlaMetric).order_by(
                SlaMetric.account_uid, SlaMetric.period_month
            )
        )
    )
    health_by_account: dict[str, list[HealthScore]] = defaultdict(list)
    sla_by_account: dict[str, list[SlaMetric]] = defaultdict(list)
    for row in health:
        health_by_account[row.account_uid].append(row)
    for row in sla:
        sla_by_account[row.account_uid].append(row)
    return accounts, health_by_account, sla_by_account


def list_accounts(
    session: Session,
    *,
    search: str | None,
    segment: str | None,
    status: str | None,
    sort: str,
    order: str,
    limit: int,
    offset: int,
    today: datetime.date,
) -> dict:
    accounts, health_by_account, sla_by_account = _load_portfolio(session)
    items = []
    for account in accounts:
        history = health_by_account[account.account_uid]
        latest_health = history[-1] if history else None
        sla_history = sla_by_account[account.account_uid]
        latest_sla = sla_history[-1] if sla_history else None
        items.append(
            {
                "account_uid": account.account_uid,
                "name": account.name,
                "segment": account.segment,
                "owner": account.owner,
                "arr": _number(account.arr),
                "sentiment": account.sentiment,
                "renewal_dt": account.renewal_dt,
                "renewal_days": _renewal_days(account.renewal_dt, today),
                "health_score": latest_health.score if latest_health else None,
                "health_status": latest_health.status if latest_health else None,
                "trend_dir": latest_health.trend_dir if latest_health else None,
                "confidence": latest_health.confidence if latest_health else None,
                "sla_actual_pct": _number(latest_sla.actual_pct) if latest_sla else None,
                "sla_target_pct": _number(latest_sla.target_pct) if latest_sla else None,
                "health_history": [
                    {"snapshot_dt": row.snapshot_dt, "score": row.score}
                    for row in history[-12:]
                ],
            }
        )

    summary = _portfolio_summary(items)
    health_trend = _portfolio_health_trend(health_by_account)
    segments = sorted({item["segment"] for item in items if item["segment"]})

    filtered = items
    if search:
        needle = search.casefold()
        filtered = [
            item
            for item in filtered
            if needle in item["name"].casefold()
            or needle in (item["segment"] or "").casefold()
            or needle in (item["owner"] or "").casefold()
        ]
    if segment:
        filtered = [item for item in filtered if item["segment"] == segment]
    if status:
        filtered = [item for item in filtered if item["health_status"] == status]

    sort_fields = {
        "name": "name",
        "arr": "arr",
        "health": "health_score",
        "sla": "sla_actual_pct",
        "renewal": "renewal_days",
    }
    key = sort_fields[sort]

    def sort_key(item: dict):
        value = item[key]
        missing = value is None
        normalized = value.casefold() if isinstance(value, str) else value
        return missing, normalized if normalized is not None else 0

    filtered.sort(key=sort_key, reverse=order == "desc")
    total = len(filtered)
    return {
        "summary": summary,
        "health_trend": health_trend,
        "accounts": filtered[offset : offset + limit],
        "pagination": {"total": total, "limit": limit, "offset": offset},
        "segments": segments,
    }


def _portfolio_summary(items: list[dict]) -> dict:
    health_values = [
        item["health_score"] for item in items if item["health_score"] is not None
    ]
    sla_values = [
        item["sla_actual_pct"] for item in items if item["sla_actual_pct"] is not None
    ]
    counts = {"healthy": 0, "watch": 0, "risk": 0, "critical": 0}
    for item in items:
        if item["health_status"] in counts:
            counts[item["health_status"]] += 1
    at_risk = [
        item for item in items if item["health_status"] in AT_RISK_STATUSES
    ]
    return {
        "total_accounts": len(items),
        "average_health": round(sum(health_values) / len(health_values), 1)
        if health_values
        else None,
        "average_sla": round(sum(sla_values) / len(sla_values), 2)
        if sla_values
        else None,
        "accounts_at_risk": len(at_risk),
        "arr_at_risk": sum(item["arr"] or 0 for item in at_risk),
        "status_counts": counts,
    }


def _portfolio_health_trend(
    health_by_account: dict[str, list[HealthScore]],
) -> list[dict]:
    by_date: dict[datetime.date, list[int]] = defaultdict(list)
    for history in health_by_account.values():
        for row in history[-26:]:
            by_date[row.snapshot_dt].append(row.score)
    return [
        {"snapshot_dt": date, "score": round(sum(scores) / len(scores), 1)}
        for date, scores in sorted(by_date.items())
    ]


def get_account_detail(
    session: Session, account_uid: str, *, today: datetime.date
) -> dict | None:
    account = session.scalar(
        select(Account).where(Account.account_uid == account_uid)
    )
    if account is None:
        return None
    health = list(
        session.scalars(
            select(HealthScore)
            .where(HealthScore.account_uid == account_uid)
            .order_by(HealthScore.snapshot_dt)
        )
    )
    sla = list(
        session.scalars(
            select(SlaMetric)
            .where(SlaMetric.account_uid == account_uid)
            .order_by(SlaMetric.period_month)
        )
    )
    signals = list(
        session.scalars(select(Signal).where(Signal.account_uid == account_uid))
    )
    actions = list(
        session.scalars(select(Action).where(Action.account_uid == account_uid))
    )
    signals.sort(
        key=lambda row: (
            SIGNAL_RANK.get(row.tone, 99),
            -row.detected_at.timestamp(),
            row.id,
        )
    )
    actions.sort(key=lambda row: (ACTION_RANK.get(row.priority, 99), row.id))
    latest_health = health[-1] if health else None
    latest_sla = sla[-1] if sla else None

    run = session.scalars(
        select(AnalysisRun).where(AnalysisRun.account_uid == account_uid).order_by(AnalysisRun.id.desc())
    ).first()
    quality = None
    if run is not None:
        detail = json.loads(run.eval_json) if run.eval_json else None
        quality = {
            "eval_score": run.eval_score,
            "verdict": detail.get("verdict") if detail else None,
            "issues": detail.get("issues") if detail else None,
            "guardrail_flags": run.guardrail_flags,
            "trace_id": run.trace_id,
        }

    return {
        "quality": quality,
        "account": {
            "account_uid": account.account_uid,
            "name": account.name,
            "segment": account.segment,
            "owner": account.owner,
            "arr": _number(account.arr),
            "sentiment": account.sentiment,
            "contract_term_months": account.contract_term_months,
            "contract_start_dt": account.contract_start_dt,
            "renewal_dt": account.renewal_dt,
        },
        "snapshot": {
            "health_score": latest_health.score if latest_health else None,
            "health_status": latest_health.status if latest_health else None,
            "trend_dir": latest_health.trend_dir if latest_health else None,
            "confidence": latest_health.confidence if latest_health else None,
            "sla_actual_pct": _number(latest_sla.actual_pct) if latest_sla else None,
            "sla_target_pct": _number(latest_sla.target_pct) if latest_sla else None,
            "renewal_days": _renewal_days(account.renewal_dt, today),
            "open_risk_count": sum(
                signal.tone in {"critical", "warn"} for signal in signals
            ),
        },
        "health_history": [
            {
                "snapshot_dt": row.snapshot_dt,
                "score": row.score,
                "status": row.status,
                "trend_dir": row.trend_dir,
                "confidence": row.confidence,
            }
            for row in health
        ],
        "sla_history": [
            {
                "period_month": row.period_month,
                "target_pct": _number(row.target_pct),
                "actual_pct": _number(row.actual_pct),
                "breached": row.breached,
            }
            for row in sla
        ],
        "signals": [
            {
                "id": row.id,
                "tone": row.tone,
                "label": row.label,
                "signal_text": row.signal_text,
                "evidence_ref": row.evidence_ref,
                "source_file": row.source_file,
                "source_file_id": row.source_file_id,
                "source_quote": row.source_quote,
                "feedback": row.feedback,
                "detected_at": row.detected_at,
            }
            for row in signals
        ],
        "actions": [
            {
                "id": row.id,
                "priority": row.priority,
                "title": row.title,
                "owner": row.owner,
                "due_label": row.due_label,
                "due_date": row.due_date,
                "rationale": row.rationale,
                "expected_impact": row.expected_impact,
                "linked_signal": row.linked_signal,
                "status": row.status,
            }
            for row in actions
        ],
    }


def list_risks(
    session: Session,
    *,
    status: str | None,
    segment: str | None,
    limit: int,
    offset: int,
    today: datetime.date,
) -> dict:
    accounts, health_by_account, _ = _load_portfolio(session)
    signals = list(session.scalars(select(Signal)))
    actions = list(session.scalars(select(Action)))
    signals_by_account: dict[str, list[Signal]] = defaultdict(list)
    actions_by_account: dict[str, list[Action]] = defaultdict(list)
    for row in signals:
        signals_by_account[row.account_uid].append(row)
    for row in actions:
        actions_by_account[row.account_uid].append(row)

    risks = []
    for account in accounts:
        history = health_by_account[account.account_uid]
        latest = history[-1] if history else None
        if latest is None or latest.status == "healthy":
            continue
        account_signals = sorted(
            (
                row
                for row in signals_by_account[account.account_uid]
                if row.tone in {"critical", "warn"}
            ),
            key=lambda row: (
                SIGNAL_RANK.get(row.tone, 99),
                -row.detected_at.timestamp(),
                row.id,
            ),
        )
        account_actions = sorted(
            actions_by_account[account.account_uid],
            key=lambda row: (ACTION_RANK.get(row.priority, 99), row.id),
        )
        driver = account_signals[0] if account_signals else None
        action = account_actions[0] if account_actions else None
        risks.append(
            {
                "account_uid": account.account_uid,
                "name": account.name,
                "segment": account.segment,
                "status": latest.status,
                "score": latest.score,
                "confidence": latest.confidence,
                "arr": _number(account.arr),
                "renewal_days": _renewal_days(account.renewal_dt, today),
                "driver_signal": {
                    "id": driver.id,
                    "tone": driver.tone,
                    "label": driver.label,
                    "signal_text": driver.signal_text,
                    "evidence_ref": driver.evidence_ref,
                }
                if driver
                else None,
                "recommended_action": {
                    "id": action.id,
                    "priority": action.priority,
                    "title": action.title,
                    "owner": action.owner,
                    "due_label": action.due_label,
                    "status": action.status,
                }
                if action
                else None,
            }
        )

    summary = {
        "total": len(risks),
        "critical": sum(item["status"] == "critical" for item in risks),
        "risk": sum(item["status"] == "risk" for item in risks),
        "watch": sum(item["status"] == "watch" for item in risks),
    }
    filtered = risks
    if status:
        filtered = [item for item in filtered if item["status"] == status]
    if segment:
        filtered = [item for item in filtered if item["segment"] == segment]
    filtered.sort(
        key=lambda item: (
            STATUS_RANK.get(item["status"], 99),
            item["score"],
            -(item["arr"] or 0),
        )
    )
    total = len(filtered)
    return {
        "summary": summary,
        "risks": filtered[offset : offset + limit],
        "pagination": {"total": total, "limit": limit, "offset": offset},
    }
