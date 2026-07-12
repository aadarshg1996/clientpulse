"""accounts — one row per client account."""

from __future__ import annotations

import datetime
import decimal

from sqlalchemy import Date, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TimestampMixin


class Account(TimestampMixin, Base):
    __tablename__ = "accounts"
    __table_args__ = (UniqueConstraint("account_uid", name="uq_accounts_account_uid"),)

    account_uid: Mapped[str] = mapped_column(Text, nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    segment: Mapped[str | None] = mapped_column(Text)
    owner: Mapped[str | None] = mapped_column(Text)
    arr: Mapped[decimal.Decimal | None] = mapped_column(Numeric(14, 2))
    sentiment: Mapped[str | None] = mapped_column(Text)
    contract_term_months: Mapped[int | None] = mapped_column(Integer)
    contract_start_dt: Mapped[datetime.date | None] = mapped_column(Date)
    renewal_dt: Mapped[datetime.date | None] = mapped_column(Date)
