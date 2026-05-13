# handlers/info/info.py
"""Раздел «Информация».

Архитектура (минимальный каркас, аналог раздела Профиль):
  * Вход — reply-кнопка `btn_info` главного меню. Здесь отправляется
    новое сообщение с фото (`send_with_media('info_main')`) и текстом
    из i18n (`info_main_text`).
  * Inline-клавиатуры пока нет — это просто карточка с информацией.
  * Выход — reply-кнопка «Назад» главного меню (`universal_back` без
    активного FSM-состояния уведёт пользователя в главное меню).

Картинку слота `info_main` можно загрузить через веб-админку
(см. `BOT_MEDIA_SLOTS` в `backend/api/routes/bot_media.py`). Если
картинка не загружена — `send_with_media` сделает fallback на текст.
"""

from typing import Callable

from aiogram import Router, types
from sqlalchemy.ext.asyncio import AsyncSession

from bot.filters.localized_text import LocalizedText
from bot.utils_media import send_with_media


router = Router()


# --- ENTRY: reply-кнопка «Информация» ---

@router.message(LocalizedText("btn_info"))
async def show_info(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
):
    """Открывает карточку раздела «Информация» — фото + текст."""
    await send_with_media(
        message,
        session,
        media_key="info_main",
        text=_("info_main_text"),
    )
