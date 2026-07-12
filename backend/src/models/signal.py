"""signals — detected risk/health signals with evidence."""

from __future__ import annotations

import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class Signal(TimestampMixin, Base):
    __tablename__ = "signals"

    account_uid: Mapped[str] = mapped_column(
        Text, ForeignKey("accounts.account_uid", ondelete="CASCADE"), nullable=False
    )
    tone: Mapped[str] = mapped_column(Text, nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    signal_text: Mapped[str | None] = mapped_column(Text)
    evidence_ref: Mapped[str | None] = mapped_column(Text)
    source_file: Mapped[str | None] = mapped_column(Text)
    source_file_id: Mapped[str | None] = mapped_column(Text)
    source_quote: Mapped[str | None] = mapped_column(Text)
    feedback: Mapped[str | None] = mapped_column(Text)
    feedback_at: Mapped[datetime.datetime | None] = mapped_column(DateTime(timezone=True))
    detected_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
