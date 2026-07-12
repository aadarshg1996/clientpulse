"""One-time agent populate: documents -> ingest + analyze -> trend backfill.

Fills the agent-derived layer that `src.seed` / `src.bootstrap` deliberately
leave empty: Document rows, the OpenAI vector store, health_scores, signals,
actions, sentiment, and the historical health trend.

Run against the target database (local, or a Render EXTERNAL connection URL).
Costs real OpenAI usage and takes several minutes for 30 accounts:

    DATABASE_URL="postgresql://..." OPENAI_API_KEY="sk-..." \
        uv run python -m src.populate --accounts 30

Accounts must already exist (bootstrap/seed). On completion it prints the
OPENAI_VECTOR_STORE_ID — set that on the Render backend service so live chat
works, then redeploy.
"""

from __future__ import annotations

import argparse
import subprocess
import sys

from sqlalchemy import select

from .db.session import get_session_factory
from .llm import config
from .models import Account
from .analysis.runner import analyze_account


def _run_module(module: str, *args: str) -> None:
    subprocess.run([sys.executable, "-m", module, *args], check=True)


def main() -> None:
    ap = argparse.ArgumentParser(description="One-time agent populate pipeline.")
    ap.add_argument("--accounts", type=int, default=30, help="how many accounts to document")
    args = ap.parse_args()

    # 1. Generate synthetic documents on disk for the existing accounts.
    print("[populate] generating documents ...")
    _run_module("src.seed_docs", "--accounts", str(args.accounts))

    # 2. Ingest + agent-analyze each account. The first analyze creates the
    #    shared vector store and persists its id into the environment.
    factory = get_session_factory()
    with factory() as session:
        uids = list(
            session.scalars(select(Account.account_uid).order_by(Account.account_uid))
        )

    ok = fail = 0
    for uid in uids:
        with factory() as session:
            try:
                analyze_account(session, uid)
                ok += 1
                print(f"[populate] analyzed {uid}  ({ok}/{len(uids)})")
            except Exception as exc:  # noqa: BLE001 — continue on per-account failure
                fail += 1
                print(f"[populate] FAILED {uid}: {exc}")

    # 3. Backfill historical health snapshots for the trend chart.
    print("[populate] backfilling health trend ...")
    _run_module("src.backfill_trend")

    vid = config.vector_store_id()
    print(f"\n[populate] done — analyzed {ok}, failed {fail} of {len(uids)}")
    print(f"[populate] OPENAI_VECTOR_STORE_ID={vid}")
    print(
        "[populate] Set OPENAI_VECTOR_STORE_ID on the Render backend service "
        "(clientpulse-api) and redeploy so live chat works."
    )


if __name__ == "__main__":
    main()
