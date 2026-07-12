"""actions — recommended next actions pending human review/approval."""

from __future__ import annotations

import datetime

from sqlalchemy import Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class Action(TimestampMixin, Base):
    __tablename__ = "actions"

    account_uid: Mapped[str] = mapped_column(
        Text, ForeignKey("accounts.account_uid", ondelete="CASCADE"), nullable=False
    )
    priority: Mapped[str] = mapped_column(Text, nullable=False)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    owner: Mapped[str | None] = mapped_column(Text)
    due_label: Mapped[str | None] = mapped_column(Text)
    due_date: Mapped[datetime.date | None] = mapped_column(Date)
    rationale: Mapped[str | None] = mapped_column(Text)
    expected_impact: Mapped[str | None] = mapped_column(Text)
    linked_signal: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="recommended")
