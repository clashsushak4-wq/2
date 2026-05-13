# database/models/bot_media.py

from typing import Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class BotMedia(Base):
    """Медиа-слоты для сообщений бота (приветствие, профиль и т.д.).

    `key` — машиночитаемый идентификатор слота (например, `onboarding_welcome`).
    `file_url` — относительный путь, возвращённый `/api/uploads/admin/upload`
    (например, `/uploads/abc.webp`). Бот резолвит его в локальный файл и
    отправляет через FSInputFile, чтобы не зависеть от внешнего хоста.
    `thumb_url` — путь к мини-превью (например, `/uploads/abc_thumb.webp`),
    используется в админке для быстрой загрузки UI.
    `tg_file_id` — кэш Telegram file_id после первой отправки. Все
    последующие отправки идут по нему — это в десятки раз быстрее, чем
    повторно заливать файл. При замене `file_url` сбрасывается в NULL.
    """

    __tablename__ = "bot_media"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    key: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    file_url: Mapped[str] = mapped_column(String(500))
    thumb_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tg_file_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
