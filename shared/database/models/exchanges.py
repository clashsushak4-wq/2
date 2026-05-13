# database/models/exchanges.py

from sqlalchemy import String, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base


class Exchange(Base):
    __tablename__ = "exchanges"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)

    # Название биржи (Binance, Bybit, OKX, ...)
    name: Mapped[str] = mapped_column(String(50))

    # Зашифрованные ключи (Fernet)
    api_key_enc: Mapped[str] = mapped_column(String(500))
    api_secret_enc: Mapped[str] = mapped_column(String(500))

    # Активна ли
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
