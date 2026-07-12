"""Output guardrail for the analyst result.

Enforces business rules the Pydantic schema can't express, repairs deterministic
violations (e.g. status band must match score), and returns a list of flags so
each run records what was off. Repair-not-reject: we keep the analysis and log
the deviation rather than discarding a paid run.
"""

from __future__ import annotations

from .schemas import AnalysisResult


def _band(score: int) -> str:
    if score >= 80:
        return "healthy"
    if score >= 65:
        return "watch"
    if score >= 50:
        return "risk"
    return "critical"


def check_and_repair(result: AnalysisResult, *, doc_types_present: set[str]) -> list[str]:
    """Validate the result in place; return human-readable guardrail flags."""
    flags: list[str] = []

    # 1. status band must match the numeric score
    expected = _band(result.health_score)
    if result.status != expected:
        flags.append(f"status '{result.status}' did not match score {result.health_score}; corrected to '{expected}'")
        result.status = expected

    # 2. every signal must cite its evidence
    uncited = [s.label for s in result.signals if not (s.evidence_ref and s.evidence_ref.strip())]
    if uncited:
        flags.append(f"{len(uncited)} signal(s) missing evidence_ref: {', '.join(uncited[:3])}")

    # 3. signals must exist
    if not result.signals:
        flags.append("no signals produced")

    # 4. missing-data honesty: if a key doc type is absent, confidence should not be high
    expected_docs = {"contract", "sow", "sla", "status", "qbr"}
    missing = expected_docs - doc_types_present
    if missing and result.confidence > 80:
        flags.append(
            f"confidence {result.confidence} too high given missing docs ({', '.join(sorted(missing))}); capped to 75"
        )
        result.confidence = 75

    return flags
