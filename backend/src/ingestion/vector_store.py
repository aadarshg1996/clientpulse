"""Sync uploaded documents into one OpenAI vector store, tagged by account_uid.

A single shared vector store holds every account's files. Each file carries an
`account_uid` attribute so File Search can be filtered per account at query time.
The vector store id is created once and written back to .env (OPENAI_VECTOR_STORE_ID).
"""

from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..llm import config
from ..models import Account, Document

DATA_ROOT = Path(os.environ.get("UPLOAD_DIR", "data/synthetic"))
DOC_TYPES = {
    "contract_msa": "contract",
    "statement_of_work": "sow",
    "sla_schedule": "sla",
    "weekly_status": "status",
    "qbr_notes": "qbr",
}


def _doc_type(filename: str) -> str:
    stem = Path(filename).stem
    return DOC_TYPES.get(stem, "other")


def ensure_vector_store() -> str:
    """Return the shared vector store id, creating + persisting it on first use."""
    vid = config.vector_store_id()
    if vid:
        return vid
    vs = config.client().vector_stores.create(name="clientpulse-docs")
    _persist_vector_store_id(vs.id)
    return vs.id


def _persist_vector_store_id(vid: str) -> None:
    """Write the new id into .env so subsequent runs reuse the same store."""
    env = Path(".env")
    lines = env.read_text().splitlines() if env.exists() else []
    out, found = [], False
    for ln in lines:
        if ln.startswith("OPENAI_VECTOR_STORE_ID="):
            out.append(f"OPENAI_VECTOR_STORE_ID={vid}")
            found = True
        else:
            out.append(ln)
    if not found:
        out.append(f"OPENAI_VECTOR_STORE_ID={vid}")
    env.write_text("\n".join(out) + "\n")
    os.environ["OPENAI_VECTOR_STORE_ID"] = vid


def save_uploads(account_uid: str, files: list[tuple[str, bytes]]) -> list[str]:
    """Write uploaded (filename, bytes) into the account's docs folder. Returns saved names."""
    folder = DATA_ROOT / account_uid
    folder.mkdir(parents=True, exist_ok=True)
    saved = []
    for name, data in files:
        safe = Path(name).name  # strip any path components
        (folder / safe).write_bytes(data)
        saved.append(safe)
    return saved


def ingest_account(session: Session, account_uid: str) -> dict:
    """Upload all docs for an account to the vector store, recording Document rows.

    Idempotent: clears prior Document rows for the account and re-uploads. (Old
    vector-store files are left in place; fine for the hackathon scale.)
    """
    account = session.scalar(select(Account).where(Account.account_uid == account_uid))
    if account is None:
        raise ValueError(f"Unknown account: {account_uid}")

    folder = DATA_ROOT / account_uid
    if not folder.is_dir():
        raise FileNotFoundError(f"No documents folder for {account_uid} ({folder})")

    vid = ensure_vector_store()
    oai = config.client()

    # cleanup: remove this account's prior files from the vector store + Files API
    # so re-ingest doesn't leave orphaned, duplicate chunks polluting retrieval.
    prior = list(session.scalars(select(Document).where(Document.account_uid == account_uid)))
    for d in prior:
        if not d.openai_file_id:
            continue
        try:
            oai.vector_stores.files.delete(vector_store_id=vid, file_id=d.openai_file_id)
        except Exception:  # noqa: BLE001 — best-effort cleanup
            pass
        try:
            oai.files.delete(d.openai_file_id)
        except Exception:  # noqa: BLE001
            pass
    session.execute(delete(Document).where(Document.account_uid == account_uid))

    uploaded = []
    for path in sorted(folder.iterdir()):
        if path.suffix.lower() not in {".pdf", ".docx", ".txt", ".md"}:
            continue
        doc_type = _doc_type(path.name)
        with path.open("rb") as fh:
            file_obj = oai.files.create(file=fh, purpose="assistants")
        oai.vector_stores.files.create_and_poll(
            vector_store_id=vid,
            file_id=file_obj.id,
            attributes={"account_uid": account_uid, "doc_type": doc_type},
        )
        session.add(Document(
            account_uid=account_uid,
            filename=path.name,
            doc_type=doc_type,
            openai_file_id=file_obj.id,
            vector_store_id=vid,
        ))
        uploaded.append({"filename": path.name, "doc_type": doc_type, "file_id": file_obj.id})

    session.commit()
    return {"account_uid": account_uid, "vector_store_id": vid, "documents": uploaded}
