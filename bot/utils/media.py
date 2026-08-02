# bot/utils/media.py
"""Helpers для отправки медиа-слотов бота, настраиваемых через админку.

Слот хранится в таблице `bot_media` (см. `shared.database.models.bot_media`).
`file_url` — путь вида `/uploads/abc.webp`. Файл лежит на сервере.

Мы используем Link Preview (Предпросмотр ссылок) для отображения медиа.
Это позволяет показывать красивую картинку с полоской (цитатой) слева, 
и при клике открывать ссылку на картинку или сайт.
"""
from __future__ import annotations

import logging
from typing import Optional

from aiogram import types
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import (
    InlineKeyboardMarkup,
    ReplyKeyboardMarkup,
    LinkPreviewOptions,
)
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database.repo.bot_media import BotMediaRepo
from shared.config import config

logger = logging.getLogger(__name__)

def _get_full_url(file_url: Optional[str]) -> Optional[str]:
    """Формирует полную ссылку на картинку для Link Preview."""
    if not file_url:
        return None
    if file_url.startswith("http"):
        return file_url
        
    base_url = config.WEBAPP_BASE_URL or config.WEBHOOK_BASE_URL
    if not base_url:
        return None
    from urllib.parse import urlparse
    parsed = urlparse(base_url)
    root_url = f"{parsed.scheme}://{parsed.netloc}"
    return root_url + file_url


async def send_with_media(
    message: types.Message,
    session: AsyncSession,
    *,
    media_key: str,
    text: str,
    reply_markup: InlineKeyboardMarkup | ReplyKeyboardMarkup | None = None,
) -> None:
    """Отправить text+kb. Если для `media_key` настроено фото — через Link Preview поверх текста."""
    repo = BotMediaRepo(session)
    media = await repo.get_by_key(media_key)

    url = _get_full_url(media.file_url) if media else None

    if url:
        link_options = LinkPreviewOptions(
            url=url,
            prefer_large_media=True,
            show_above_text=True,
        )
    else:
        link_options = LinkPreviewOptions(is_disabled=True)

    try:
        await message.answer(
            text, 
            reply_markup=reply_markup,
            link_preview_options=link_options,
        )
    except TelegramBadRequest as e:
        logger.warning(
            "send_with_media(%s): отправка с link_preview упала, fallback to text: %s",
            media_key, e,
        )
        await message.answer(text, reply_markup=reply_markup)


async def edit_with_media(
    callback: types.CallbackQuery,
    session: AsyncSession,
    *,
    media_key: str,
    text: str,
    reply_markup: InlineKeyboardMarkup | None = None,
) -> None:
    """Редактирует текущее сообщение (всегда текстовое с Link Preview)."""
    repo = BotMediaRepo(session)
    media = await repo.get_by_key(media_key)

    url = _get_full_url(media.file_url) if media else None

    if url:
        link_options = LinkPreviewOptions(
            url=url,
            prefer_large_media=True,
            show_above_text=True,
        )
    else:
        link_options = LinkPreviewOptions(is_disabled=True)

    msg = callback.message
    
    # Если старое сообщение почему-то было отправлено с реальным фото (остаток от старой логики),
    # мы не сможем его изменить через edit_text. Нужно удалить и отправить заново.
    if msg.photo:
        try:
            await msg.delete()
        except TelegramBadRequest:
            pass
        
        await send_with_media(
            msg, session,
            media_key=media_key, text=text, reply_markup=reply_markup,
        )
        return

    # Если сообщение текстовое, просто меняем его
    try:
        await msg.edit_text(
            text=text, 
            reply_markup=reply_markup,
            link_preview_options=link_options,
        )
    except TelegramBadRequest as e:
        logger.info("edit_with_media(%s): edit_text fail: %s", media_key, e)
