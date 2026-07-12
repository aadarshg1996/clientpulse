"""Run the account chat agent for one turn (stateless — history passed in)."""

from __future__ import annotations

from agents import Runner, trace, gen_trace_id
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..agents.chat import build_chat_agent
from ..llm import config
from ..models import Account, Document
from .runner import _account_facts


def _sources_for(session: Session, account_uid: str, vid: str, query: str) -> list[str]:
    """The actual documents most relevant to the question (for source chips)."""
    filenames = {
        d.openai_file_id: d.filename
        for d in session.scalars(select(Document).where(Document.account_uid == account_uid))
        if d.openai_file_id
    }
    try:
        res = config.client().vector_stores.search(
            vector_store_id=vid,
            query=query,
            max_num_results=3,
            filters={"type": "eq", "key": "account_uid", "value": account_uid},
        )
    except Exception:  # noqa: BLE001 — sources are best-effort
        return []
    out: list[str] = []
    for d in getattr(res, "data", None) or []:
        fn = filenames.get(getattr(d, "file_id", None)) or getattr(d, "filename", None)
        if fn and fn not in out:
            out.append(fn)
    return out


def chat_account(session: Session, account_uid: str, message: str, history: list[dict]) -> dict:
    account = session.scalar(select(Account).where(Account.account_uid == account_uid))
    if account is None:
        raise ValueError(f"Unknown account: {account_uid}")
    vid = config.vector_store_id()
    if not vid:
        raise RuntimeError("No vector store configured — ingest documents first")

    facts = _account_facts(session, account)
    agent = build_chat_agent(account_uid, vid, facts)

    # last few turns for context + the new question
    items = [
        {"role": h["role"], "content": h["content"]}
        for h in (history or [])[-8:]
        if h.get("role") in {"user", "assistant"} and h.get("content")
    ]
    items.append({"role": "user", "content": message})

    with trace("clientpulse chat", trace_id=gen_trace_id(), group_id=account_uid):
        result = Runner.run_sync(agent, items)
    return {"answer": str(result.final_output), "sources": _sources_for(session, account_uid, vid, message)}
