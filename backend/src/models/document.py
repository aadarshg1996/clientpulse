"""documents — uploaded source files synced to the OpenAI vector store."""

from __future__ import annotations

import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class Document(TimestampMixin, Base):
    __tablename__ = "documents"

    account_uid: Mapped[str] = mapped_column(
        Text, ForeignKey("accounts.account_uid", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    doc_type: Mapped[str | None] = mapped_column(Text)
    openai_file_id: Mapped[str | None] = mapped_column(Text)
    vector_store_id: Mapped[str | None] = mapped_column(Text)
    uploaded_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
