"""Structured output schema the analyst agent must return."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Tone = Literal["critical", "warn", "good", "neutral"]
Status = Literal["healthy", "watch", "risk", "critical"]
TrendDir = Literal["up", "down", "stable"]
Priority = Literal["High", "Medium", "Low"]
Sentiment = Literal["Positive", "Neutral", "Mixed", "Negative"]


class AnalysisSignal(BaseModel):
    tone: Tone
    label: str = Field(description="Short signal name, e.g. 'SLA breach'")
    signal_text: str = Field(description="One sentence describing the signal, grounded in evidence")
    evidence_ref: str = Field(description="Which document/clause this came from, e.g. 'Contract MSA · §18' or 'QBR notes'")


class AnalysisAction(BaseModel):
    priority: Priority
    title: str
    owner: str = Field(description="Who should own this action, e.g. 'PMO', 'Account', or a person")
    due_label: str = Field(description="Human due window, e.g. '3 days', '2 weeks', '1 month'")
    rationale: str = Field(description="Why this action, grounded in the evidence — one sentence")
    expected_impact: str = Field(description="What it protects/improves, e.g. 'protects $2.3M renewal'")
    linked_signal: str = Field(description="The label of the signal this action addresses")


class AnalysisResult(BaseModel):
    health_score: int = Field(ge=0, le=100, description="Overall account health 0-100")
    status: Status
    trend_dir: TrendDir
    confidence: int = Field(ge=0, le=100, description="Confidence 0-100; lower it when evidence is missing")
    sentiment: Sentiment
    summary: str = Field(description="2-3 sentence manager-facing summary")
    signals: list[AnalysisSignal]
    actions: list[AnalysisAction]
