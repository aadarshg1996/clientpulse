"""LLM-as-judge: scores a completed analysis on quality dimensions.

No tools — the evidence (signal text + the real cited quotes) is given inline,
so the judge assesses grounding and hallucination against what was actually
retrieved, plus rubric adherence and completeness.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from agents import Agent, Runner

from ..llm import config


class JudgeResult(BaseModel):
    grounding: int = Field(ge=0, le=100, description="Are signals supported by their cited quotes?")
    hallucination_free: int = Field(ge=0, le=100, description="100 = no unsupported claims")
    rubric_adherence: int = Field(ge=0, le=100, description="Does the score/status match signal severity?")
    completeness: int = Field(ge=0, le=100, description="Were obvious risks in the evidence covered?")
    overall: int = Field(ge=0, le=100, description="Holistic quality score")
    verdict: str = Field(description="One-sentence assessment")
    issues: list[str] = Field(description="Specific problems found (empty if none)")


INSTRUCTIONS = """\
You are a strict QA reviewer for an account-health analysis produced by another AI.
You are given the analysis (health score, status, confidence, signals) and, for each
signal, the actual document quote it was grounded in.

Score 0-100 on each dimension, being critical:
- grounding: is each signal actually supported by its cited quote? Penalize signals
  whose quote does not support the claim, or that cite nothing.
- hallucination_free: 100 if no claim lacks supporting evidence; lower for invented facts.
- rubric_adherence: does the numeric score/status match the severity of the signals?
  (>=80 healthy, 65-79 watch, 50-64 risk, <50 critical.)
- completeness: given the evidence, were the obvious risks captured, or were important
  ones missed?
- overall: your holistic quality score.
List concrete issues you found. Be honest — a flattering score is a failed review.
"""


def build_judge() -> Agent:
    return Agent(
        name="ClientPulse Judge",
        model=config.model_mini(),
        instructions=INSTRUCTIONS,
        output_type=JudgeResult,
    )


def evaluate(account_name: str, score: int, status: str, confidence: int, signals) -> JudgeResult:
    """Score a completed analysis. `signals` is an iterable with .tone/.label/.signal_text/.source_quote."""
    lines = [
        f"- [{s.tone}] {s.label}: {s.signal_text}\n    cited quote: {s.source_quote or '(no quote retrieved)'}"
        for s in signals
    ]
    payload = (
        f"Account: {account_name}\n"
        f"Health score {score} (status {status}), confidence {confidence}.\n"
        f"Signals and their cited evidence:\n" + "\n".join(lines)
    )
    return Runner.run_sync(build_judge(), payload).final_output
