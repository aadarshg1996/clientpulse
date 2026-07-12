"""Public response schemas for the read API."""

from __future__ import annotations

import datetime

from pydantic import BaseModel


class StatusCounts(BaseModel):
    healthy: int = 0
    watch: int = 0
    risk: int = 0
    critical: int = 0


class PortfolioSummary(BaseModel):
    total_accounts: int
    average_health: float | None
    average_sla: float | None
    accounts_at_risk: int
    arr_at_risk: float
    status_counts: StatusCounts


class HealthPoint(BaseModel):
    snapshot_dt: datetime.date
    score: float


class AccountListItem(BaseModel):
    account_uid: str
    name: str
    segment: str | None
    owner: str | None
    arr: float | None
    sentiment: str | None
    renewal_dt: datetime.date | None
    renewal_days: int | None
    health_score: int | None
    health_status: str | None
    trend_dir: str | None
    confidence: int | None
    sla_actual_pct: float | None
    sla_target_pct: float | None
    health_history: list[HealthPoint]


class Pagination(BaseModel):
    total: int
    limit: int
    offset: int


class AccountsResponse(BaseModel):
    summary: PortfolioSummary
    health_trend: list[HealthPoint]
    accounts: list[AccountListItem]
    pagination: Pagination
    segments: list[str]


class AccountProfile(BaseModel):
    account_uid: str
    name: str
    segment: str | None
    owner: str | None
    arr: float | None
    sentiment: str | None
    contract_term_months: int | None
    contract_start_dt: datetime.date | None
    renewal_dt: datetime.date | None


class AccountSnapshot(BaseModel):
    health_score: int | None
    health_status: str | None
    trend_dir: str | None
    confidence: int | None
    sla_actual_pct: float | None
    sla_target_pct: float | None
    renewal_days: int | None
    open_risk_count: int


class HealthHistoryItem(BaseModel):
    snapshot_dt: datetime.date
    score: int
    status: str | None
    trend_dir: str | None
    confidence: int | None


class SlaHistoryItem(BaseModel):
    period_month: datetime.date
    target_pct: float
    actual_pct: float
    breached: bool


class SignalItem(BaseModel):
    id: int
    tone: str
    label: str
    signal_text: str | None
    evidence_ref: str | None
    source_file: str | None
    source_file_id: str | None
    source_quote: str | None
    feedback: str | None
    detected_at: datetime.datetime


class ActionItem(BaseModel):
    id: int
    priority: str
    title: str
    owner: str | None
    due_label: str | None
    due_date: datetime.date | None
    rationale: str | None
    expected_impact: str | None
    linked_signal: str | None
    status: str


class AnalysisQuality(BaseModel):
    eval_score: int | None
    verdict: str | None
    issues: list[str] | None
    guardrail_flags: str | None
    trace_id: str | None


class AccountDetailResponse(BaseModel):
    quality: AnalysisQuality | None
    account: AccountProfile
    snapshot: AccountSnapshot
    health_history: list[HealthHistoryItem]
    sla_history: list[SlaHistoryItem]
    signals: list[SignalItem]
    actions: list[ActionItem]


class RiskSignal(BaseModel):
    id: int
    tone: str
    label: str
    signal_text: str | None
    evidence_ref: str | None


class RiskAction(BaseModel):
    id: int
    priority: str
    title: str
    owner: str | None
    due_label: str | None
    status: str


class RiskQueueItem(BaseModel):
    account_uid: str
    name: str
    segment: str | None
    status: str
    score: int
    confidence: int | None
    arr: float | None
    renewal_days: int | None
    driver_signal: RiskSignal | None
    recommended_action: RiskAction | None


class RiskSummary(BaseModel):
    total: int
    critical: int
    risk: int
    watch: int


class RisksResponse(BaseModel):
    summary: RiskSummary
    risks: list[RiskQueueItem]
    pagination: Pagination
