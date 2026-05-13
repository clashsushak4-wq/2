from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class BotMediaResponse(BaseModel):
    """Описание одного слота. file_url=None означает «слот пустой».

    `thumb_url` — путь к мини-превью (для быстрой загрузки списка в админке).
    Может отсутствовать, если файл — видео.
    """

    key: str
    file_url: Optional[str] = None
    thumb_url: Optional[str] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BotMediaUpdate(BaseModel):
    file_url: str
    thumb_url: Optional[str] = None
