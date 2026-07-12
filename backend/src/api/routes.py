"""Read-only ClientPulse routes."""

from __future__ import annotations

import datetime
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..analysis.chat import chat_account
from ..analysis.evaluate import evaluate_account
from ..analysis.runner import analyze_account
from ..ingestion.vector_store import ingest_account, save_uploads
from .dependencies import get_db
from .schemas import AccountDetailResponse, AccountsResponse, RisksResponse
from .services import (
    get_account_detail,
    list_accounts,
    list_documents,
    list_risks,
    update_action_status,
    update_signal_feedback,
)

router = APIRouter()
DbSession = Annotated[Session, Depends(get_db)]
Status = Literal["healthy", "watch", "risk", "critical"]


@router.get("/accounts", response_model=AccountsResponse)
def accounts(
    db: DbSession,
    search: str | None = Query(default=None, min_length=1),
    segment: str | None = None,
    status: Status | None = None,
    sort: Literal["name", "arr", "health", "sla", "renewal"] = "health",
    order: Literal["asc", "desc"] = "asc",
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    return list_accounts(
        db,
        search=search,
        segment=segment,
        status=status,
        sort=sort,
        order=order,
        limit=limit,
        offset=offset,
        today=datetime.date.today(),
    )


@router.get("/accounts/{account_uid}", response_model=AccountDetailResponse)
def account_detail(account_uid: str, db: DbSession) -> dict:
    result = get_account_detail(db, account_uid, today=datetime.date.today())
    if result is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return result


@router.get("/accounts/{account_uid}/documents")
def documents(account_uid: str, db: DbSession) -> dict:
    return {"documents": list_documents(db, account_uid)}


@router.post("/accounts/{account_uid}/documents")
async def upload_documents(account_uid: str, db: DbSession, files: list[UploadFile]) -> dict:
    """Upload one or more documents for an account, then sync them to the vector store."""
    payload = [(f.filename or "upload", await f.read()) for f in files]
    save_uploads(account_uid, payload)
    try:
        return ingest_account(db, account_uid)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/accounts/{account_uid}/ingest")
def ingest(account_uid: str, db: DbSession) -> dict:
    """Sync the account's on-disk documents into the vector store (Stage A)."""
    try:
        return ingest_account(db, account_uid)
    except (ValueError, FileNotFoundError) as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.patch("/actions/{action_id}")
def patch_action(
    action_id: int,
    db: DbSession,
    status: Literal["recommended", "approved", "dismissed", "done"],
    owner: str | None = None,
    due_label: str | None = None,
) -> dict:
    """Approve / dismiss / reassign a recommended action (human-in-the-loop)."""
    result = update_action_status(db, action_id, status=status, owner=owner, due_label=due_label)
    if result is None:
        raise HTTPException(status_code=404, detail="Action not found")
    return result


@router.post("/accounts/{account_uid}/analyze")
def analyze(account_uid: str, db: DbSession) -> dict:
    """Run the analyst agent over the account and persist its output (Stage B)."""
    try:
        return analyze_account(db, account_uid)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


class ChatTurn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatTurn] = []


@router.post("/accounts/{account_uid}/chat")
def chat(account_uid: str, db: DbSession, body: ChatRequest) -> dict:
    """Grounded Q&A over one account's documents + facts."""
    try:
        return chat_account(db, account_uid, body.message, [t.model_dump() for t in body.history])
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post("/accounts/{account_uid}/evaluate")
def evaluate(account_uid: str, db: DbSession) -> dict:
    """Score the latest analysis with the LLM judge (grounding, hallucination, rubric)."""
    try:
        return evaluate_account(db, account_uid)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.patch("/signals/{signal_id}")
def patch_signal(
    signal_id: int,
    db: DbSession,
    feedback: Literal["confirmed", "false_positive", "none"],
) -> dict:
    """Manager feedback on a signal — confirm or flag false-positive (fed back into re-analysis)."""
    value = None if feedback == "none" else feedback
    result = update_signal_feedback(db, signal_id, feedback=value)
    if result is None:
        raise HTTPException(status_code=404, detail="Signal not found")
    return result


@router.get("/risks", response_model=RisksResponse)
def risks(
    db: DbSession,
    status: Literal["watch", "risk", "critical"] | None = None,
    segment: str | None = None,
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> dict:
    return list_risks(
        db,
        status=status,
        segment=segment,
        limit=limit,
        offset=offset,
        today=datetime.date.today(),
    )
