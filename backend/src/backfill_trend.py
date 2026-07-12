"""Expand each account's single health snapshot into a weekly history.

Lets the portfolio trend chart render a real curve without re-running the agent.
Idempotent — safe to run repeatedly.

Usage: uv run python -m src.backfill_trend
"""

from __future__ import annotations

import datetime

from sqlalchemy import delete, select

from .analysis.runner import _band, make_history
from .db.session import get_session_factory
from .models import Account, HealthScore


def main() -> None:
    today = datetime.date.today()
    factory = get_session_factory()
    with factory() as session:
        accounts = list(session.scalars(select(Account)))
        n_rows = 0
        for a in accounts:
            latest = session.scalars(
                select(HealthScore).where(HealthScore.account_uid == a.account_uid)
                .order_by(HealthScore.snapshot_dt.desc())
            ).first()
            if latest is None:
                continue
            score, trend, conf, status = latest.score, latest.trend_dir, latest.confidence, latest.status
            session.execute(delete(HealthScore).where(HealthScore.account_uid == a.account_uid))
            hist = make_history(score, trend)
            n = len(hist)
            for i, v in enumerate(hist):
                session.add(HealthScore(
                    account_uid=a.account_uid,
                    snapshot_dt=today - datetime.timedelta(weeks=n - 1 - i),
                    score=v,
                    status=status if i == n - 1 else _band(v),
                    trend_dir=trend,
                    confidence=conf,
                ))
                n_rows += 1
        session.commit()
    print(f"Backfilled {n_rows} health rows across {len(accounts)} accounts.")


if __name__ == "__main__":
    main()
