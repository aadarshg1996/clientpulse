from __future__ import annotations

import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from src.api.dependencies import get_db
from src.api.main import create_app
from src.models import Account, Action, Base, HealthScore, Signal, SlaMetric


@pytest.fixture()
def session() -> Session:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        yield db


@pytest.fixture()
def client(session: Session) -> TestClient:
    app = create_app()

    def override_db():
        yield session

    app.dependency_overrides[get_db] = override_db
    return TestClient(app)


@pytest.fixture()
def seeded(session: Session) -> Session:
    today = datetime.date.today()
    accounts = [
        Account(
            id=1,
            account_uid="acct-critical",
            name="Alpha Energy",
            segment="Energy",
            owner="A. Owner",
            arr=1_000_000,
            sentiment="Negative",
            contract_term_months=24,
            contract_start_dt=today - datetime.timedelta(days=300),
            renewal_dt=today + datetime.timedelta(days=30),
        ),
        Account(
            id=2,
            account_uid="acct-watch",
            name="Beta Retail",
            segment="Retail",
            owner="B. Owner",
            arr=500_000,
            sentiment="Mixed",
            renewal_dt=today + datetime.timedelta(days=90),
        ),
        Account(
            id=3,
            account_uid="acct-healthy",
            name="Gamma Health",
            segment="Healthcare",
            owner="C. Owner",
            arr=2_000_000,
            sentiment="Positive",
            renewal_dt=today + datetime.timedelta(days=180),
        ),
        Account(
            id=4,
            account_uid="acct-missing",
            name="Delta Unknown",
            segment=None,
            owner=None,
            arr=None,
            sentiment=None,
            renewal_dt=None,
        ),
    ]
    session.add_all(accounts)
    health_rows = [
        HealthScore(
            id=1,
            account_uid="acct-critical",
            snapshot_dt=today - datetime.timedelta(days=7),
            score=45,
            status="critical",
            trend_dir="down",
            confidence=80,
        ),
        HealthScore(
            id=2,
            account_uid="acct-critical",
            snapshot_dt=today,
            score=40,
            status="critical",
            trend_dir="down",
            confidence=82,
        ),
        HealthScore(
            id=3,
            account_uid="acct-watch",
            snapshot_dt=today,
            score=70,
            status="watch",
            trend_dir="stable",
            confidence=70,
        ),
        HealthScore(
            id=4,
            account_uid="acct-healthy",
            snapshot_dt=today,
            score=90,
            status="healthy",
            trend_dir="up",
            confidence=90,
        ),
    ]
    session.add_all(health_rows)
    session.add_all(
        [
            SlaMetric(
                id=1,
                account_uid="acct-critical",
                period_month=today.replace(day=1),
                target_pct=95,
                actual_pct=80,
                breached=True,
            ),
            SlaMetric(
                id=2,
                account_uid="acct-watch",
                period_month=today.replace(day=1),
                target_pct=95,
                actual_pct=94,
                breached=True,
            ),
            SlaMetric(
                id=3,
                account_uid="acct-healthy",
                period_month=today.replace(day=1),
                target_pct=95,
                actual_pct=99,
                breached=False,
            ),
        ]
    )
    detected = datetime.datetime.now(datetime.UTC)
    session.add_all(
        [
            Signal(
                id=1,
                account_uid="acct-critical",
                tone="warn",
                label="Renewal upcoming",
                signal_text="Renewal needs attention",
                evidence_ref="Contract",
                detected_at=detected,
            ),
            Signal(
                id=2,
                account_uid="acct-critical",
                tone="critical",
                label="SLA breach",
                signal_text="SLA below target",
                evidence_ref="SLA report",
                detected_at=detected - datetime.timedelta(days=1),
            ),
            Signal(
                id=3,
                account_uid="acct-watch",
                tone="warn",
                label="SLA at risk",
                signal_text="SLA nearing breach",
                evidence_ref="SLA report",
                detected_at=detected,
            ),
        ]
    )
    session.add_all(
        [
            Action(
                id=1,
                account_uid="acct-critical",
                priority="Medium",
                title="Review renewal",
                owner="Account",
                due_label="1 week",
            ),
            Action(
                id=2,
                account_uid="acct-critical",
                priority="High",
                title="Create remediation plan",
                owner="PMO",
                due_label="3 days",
            ),
            Action(
                id=3,
                account_uid="acct-watch",
                priority="Medium",
                title="Monitor SLA",
                owner="Delivery",
                due_label="1 week",
            ),
        ]
    )
    session.commit()
    return session
