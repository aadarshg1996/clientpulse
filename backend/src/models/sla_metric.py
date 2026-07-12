"""sla_metrics — monthly SLA target vs actual per account."""

from __future__ import annotations

import datetime
import decimal

from sqlalchemy import Boolean, Date, ForeignKey, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class SlaMetric(TimestampMixin, Base):
    __tablename__ = "sla_metrics"

    account_uid: Mapped[str] = mapped_column(
        Text, ForeignKey("accounts.account_uid", ondelete="CASCADE"), nullable=False
    )
    period_month: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    target_pct: Mapped[decimal.Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    actual_pct: Mapped[decimal.Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    breached: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
