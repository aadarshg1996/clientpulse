"""health_scores — weekly health snapshots per account."""

from __future__ import annotations

import datetime

from sqlalchemy import Date, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class HealthScore(TimestampMixin, Base):
    __tablename__ = "health_scores"

    account_uid: Mapped[str] = mapped_column(
        Text, ForeignKey("accounts.account_uid", ondelete="CASCADE"), nullable=False
    )
    snapshot_dt: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str | None] = mapped_column(Text)
    trend_dir: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[int | None] = mapped_column(Integer)
