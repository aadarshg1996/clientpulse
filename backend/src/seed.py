"""Synthetic GROUND-TRUTH data generator for the clientpulse database.

Usage:
    uv run python -m src.seed --accounts 30 [--seed 42]

Seeds only data that comes from source systems / uploaded documents:
  - accounts: identity (name, segment, owner) + commercials from the contract
    (ARR, term, start, renewal date)
  - sla_metrics: monthly target vs actual attainment (from SLA reports)

Agent-derived fields are intentionally left empty until the agent layer runs:
  - health_scores, signals, actions (tables stay empty)
  - accounts.sentiment (null — inferred from QBR text by an agent)

Idempotent: truncates all tables and regenerates on every run.
"""

from __future__ import annotations

import argparse
import datetime
import random

from faker import Faker
from sqlalchemy import text

from .db.session import get_session_factory
from .models import Account, SlaMetric

SEGMENTS = [
    "Energy", "Media", "Industrial", "Finance", "Retail", "Legal", "Healthcare",
    "Logistics", "SaaS", "Pharma", "Telecom", "Education", "Travel", "Insurance",
    "Construction", "Gaming", "Automotive", "Hospitality",
]
TERMS = [12, 24, 36]
SLA_MONTHS = 6


def clamp(v: float, lo: int = 60, hi: int = 100) -> int:
    return max(lo, min(hi, round(v)))


# Per-tier ground-truth profile so the portfolio has a realistic spread, not all-red.
# (sla_lo, sla_hi) = monthly attainment band; (renew_lo, renew_hi) = days to renewal.
TIER_PROFILE = {
    "healthy":  {"sla": (96, 99), "renew": (130, 170)},
    "watch":    {"sla": (91, 96), "renew": (90, 150)},
    "risk":     {"sla": (84, 92), "renew": (55, 110)},
    "critical": {"sla": (72, 86), "renew": (30, 60)},
}
# 30-account distribution: 9 healthy · 8 watch · 7 risk · 6 critical
TIER_PLAN = (["healthy"] * 9) + (["watch"] * 8) + (["risk"] * 7) + (["critical"] * 6)


def generate(n: int, rng: random.Random, fake: Faker) -> list[dict]:
    today = datetime.date.today()
    plan = (TIER_PLAN * (n // len(TIER_PLAN) + 1))[:n]
    rng.shuffle(plan)
    rows: list[dict] = []
    for i in range(n):
        uid = f"acct-{i + 1:04d}"
        tier = plan[i]
        prof = TIER_PROFILE[tier]
        arr = round(rng.uniform(3e5, 3.5e6), -3)
        term = rng.choice(TERMS)
        start = today - datetime.timedelta(days=rng.randint(120, 900))
        renewal_dt = today + datetime.timedelta(days=rng.randint(*prof["renew"]))

        # SLA attainment — ground truth, banded by tier
        sla_rows = []
        for m in range(SLA_MONTHS):
            month_dt = (today.replace(day=1) - datetime.timedelta(days=30 * (SLA_MONTHS - 1 - m))).replace(day=1)
            actual = clamp(rng.randint(*prof["sla"]))
            sla_rows.append({
                "period_month": month_dt,
                "target_pct": 95,
                "actual_pct": actual,
                "breached": actual < 95,
            })

        rows.append({
            "account": {
                "account_uid": uid,
                "name": fake.company(),
                "segment": rng.choice(SEGMENTS),
                "owner": f"{fake.first_name()[0]}. {fake.last_name()}",
                "arr": arr,
                "sentiment": None,  # agent-derived — left empty
                "contract_term_months": term,
                "contract_start_dt": start,
                "renewal_dt": renewal_dt,
            },
            "sla": sla_rows,
        })
    return rows


def main() -> None:
    ap = argparse.ArgumentParser(description="Generate synthetic ground-truth clientpulse data.")
    ap.add_argument("--accounts", type=int, default=30, help="number of accounts to generate")
    ap.add_argument("--seed", type=int, default=42, help="RNG seed for reproducibility")
    args = ap.parse_args()

    rng = random.Random(args.seed)
    fake = Faker()
    fake.seed_instance(args.seed)

    data = generate(args.accounts, rng, fake)

    factory = get_session_factory()
    with factory() as session:
        # idempotent: clear everything, reset identity. health_scores / signals /
        # actions stay empty — they are the agent layer's output target.
        session.execute(text(
            "TRUNCATE actions, signals, sla_metrics, health_scores, accounts "
            "RESTART IDENTITY CASCADE"
        ))
        n_sla = 0
        for row in data:
            session.add(Account(**row["account"]))
            uid = row["account"]["account_uid"]
            for s in row["sla"]:
                session.add(SlaMetric(account_uid=uid, **s))
                n_sla += 1
        session.commit()

    print(
        f"Seeded {len(data)} accounts · {n_sla} sla rows (ground truth). "
        "health_scores / signals / actions left empty for the agent layer."
    )


if __name__ == "__main__":
    main()
