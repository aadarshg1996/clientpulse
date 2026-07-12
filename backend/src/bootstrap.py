"""Idempotent deploy-time DB bootstrap (safe to run on every start).

Runs before the API server on Render:
  1. Applies schema.sql if the core tables are absent (first deploy).
  2. Seeds ground-truth accounts + SLA rows only if the DB is empty.

Deliberately CHEAP and OpenAI-free so it can live in the start command without
risking the port-bind health check. The heavy agent layer (documents, health
scores, signals, actions, chat vector store) is populated separately by the
one-time populate pipeline — see `src.populate`. This never truncates, so it
will not clobber data produced by that pipeline on later redeploys.

Usage:
    uv run python -m src.bootstrap
"""

from __future__ import annotations

import pathlib
import random

from faker import Faker
from sqlalchemy import text

from .db.session import get_engine, get_session_factory
from .models import Account, SlaMetric
from .seed import generate

_SCHEMA_PATH = pathlib.Path(__file__).resolve().parent.parent / "schema.sql"


def _accounts_table_exists() -> bool:
    with get_engine().connect() as conn:
        return bool(
            conn.execute(
                text("SELECT to_regclass('public.accounts')")
            ).scalar()
        )


def _apply_schema() -> None:
    sql = _SCHEMA_PATH.read_text()
    # psycopg2 executes multiple semicolon-separated statements in one call.
    with get_engine().begin() as conn:
        conn.exec_driver_sql(sql)
    print(f"[bootstrap] applied schema from {_SCHEMA_PATH.name}")


def _account_count() -> int:
    with get_engine().connect() as conn:
        return int(conn.execute(text("SELECT count(*) FROM accounts")).scalar() or 0)


def _seed_if_empty(accounts: int = 30, seed: int = 42) -> None:
    if _account_count() > 0:
        print("[bootstrap] accounts present — skipping seed")
        return
    rng = random.Random(seed)
    fake = Faker()
    fake.seed_instance(seed)
    data = generate(accounts, rng, fake)
    factory = get_session_factory()
    with factory() as session:
        n_sla = 0
        for row in data:
            session.add(Account(**row["account"]))
            uid = row["account"]["account_uid"]
            for s in row["sla"]:
                session.add(SlaMetric(account_uid=uid, **s))
                n_sla += 1
        session.commit()
    print(f"[bootstrap] seeded {len(data)} accounts · {n_sla} sla rows")


def main() -> None:
    if not _accounts_table_exists():
        _apply_schema()
    else:
        print("[bootstrap] schema present — skipping apply")
    _seed_if_empty()
    print("[bootstrap] done")


if __name__ == "__main__":
    main()
