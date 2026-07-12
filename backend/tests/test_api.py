from __future__ import annotations

import datetime


def test_accounts_returns_summary_and_excludes_missing_from_averages(client, seeded):
    response = client.get("/accounts")
    assert response.status_code == 200
    body = response.json()
    assert body["summary"] == {
        "total_accounts": 4,
        "average_health": 66.7,
        "average_sla": 91.0,
        "accounts_at_risk": 1,
        "arr_at_risk": 1_000_000.0,
        "status_counts": {
            "healthy": 1,
            "watch": 1,
            "risk": 0,
            "critical": 1,
        },
    }
    assert body["pagination"]["total"] == 4
    assert body["segments"] == ["Energy", "Healthcare", "Retail"]
    missing = next(
        row for row in body["accounts"] if row["account_uid"] == "acct-missing"
    )
    assert missing["health_score"] is None
    assert missing["sla_actual_pct"] is None


def test_accounts_filter_sort_and_paginate(client, seeded):
    response = client.get(
        "/accounts",
        params={
            "search": "a",
            "status": "healthy",
            "sort": "arr",
            "order": "desc",
            "limit": 1,
            "offset": 0,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["pagination"] == {"total": 1, "limit": 1, "offset": 0}
    assert body["accounts"][0]["account_uid"] == "acct-healthy"
    assert body["summary"]["total_accounts"] == 4


def test_accounts_empty_database(client):
    response = client.get("/accounts")
    assert response.status_code == 200
    body = response.json()
    assert body["summary"]["average_health"] is None
    assert body["summary"]["average_sla"] is None
    assert body["accounts"] == []
    assert body["health_trend"] == []


def test_account_detail_orders_histories_signals_and_actions(client, seeded):
    response = client.get("/accounts/acct-critical")
    assert response.status_code == 200
    body = response.json()
    assert body["snapshot"]["renewal_days"] == 30
    assert body["snapshot"]["open_risk_count"] == 2
    assert [row["score"] for row in body["health_history"]] == [45, 40]
    assert [row["tone"] for row in body["signals"]] == ["critical", "warn"]
    assert [row["priority"] for row in body["actions"]] == ["High", "Medium"]


def test_account_detail_returns_404(client):
    response = client.get("/accounts/not-found")
    assert response.status_code == 404
    assert response.json() == {"detail": "Account not found"}


def test_risks_excludes_healthy_and_missing_and_prioritizes(client, seeded):
    response = client.get("/risks")
    assert response.status_code == 200
    body = response.json()
    assert body["summary"] == {
        "total": 2,
        "critical": 1,
        "risk": 0,
        "watch": 1,
    }
    assert [row["account_uid"] for row in body["risks"]] == [
        "acct-critical",
        "acct-watch",
    ]
    first = body["risks"][0]
    assert first["driver_signal"]["tone"] == "critical"
    assert first["recommended_action"]["priority"] == "High"


def test_risks_filter_and_pagination(client, seeded):
    response = client.get(
        "/risks",
        params={"status": "watch", "segment": "Retail", "limit": 1},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["pagination"] == {"total": 1, "limit": 1, "offset": 0}
    assert body["risks"][0]["account_uid"] == "acct-watch"


def test_openapi_and_cors(client):
    assert client.get("/docs").status_code == 200
    response = client.options(
        "/accounts",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.status_code == 200
    assert (
        response.headers["access-control-allow-origin"]
        == "http://localhost:5173"
    )


def test_renewal_date_is_iso_formatted(client, seeded):
    response = client.get("/accounts/acct-critical")
    renewal = response.json()["account"]["renewal_dt"]
    assert renewal == (
        datetime.date.today() + datetime.timedelta(days=30)
    ).isoformat()
