"""Durable virtual accounts; exchange funds and orders are never modified."""

from sqlalchemy import BigInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, JsonType


class DemoAccount(Base):
    __tablename__ = "demo_accounts"
    __table_args__ = (UniqueConstraint("user_id", "source_key", name="uq_demo_account_source"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(BigInteger, index=True)
    source_key: Mapped[str] = mapped_column(String(160), index=True)
    snapshot: Mapped[dict] = mapped_column(JsonType)
