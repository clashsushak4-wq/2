# bot/utils_media.py
"""Helpers для отправки медиа-слотов бота, настраиваемых через админку.

Слот хранится в таблице `bot_media` (см. `shared.database.models.bot_media`).
`file_url` — относительный путь вида `/uploads/abc.webp`. Файл лежит в
`<repo>/uploads/`.

Стратегия отправки (от быстрого к медленному):
  1. Если есть закэшированный `tg_file_id` — отправляем по нему. Это
     мгновенно, Telegram отдаёт картинку из своего CDN-кэша.
  2. Иначе — `FSInputFile` (читаем файл с диска и заливаем в Telegram).
     После успешной отправки сохраняем полученный `file_id` в БД, чтобы
     все последующие отправки шли по пути 1.
  3. Fallback на `message.answer(text)` если: слот пустой, файл удалён,
     `tg_file_id` стал невалидным, любой другой Telegram-error. Бот
     никогда не падает из-за отсутствующей картинки.

При замене файла в админке (`PUT /api/admin/bot-media/{key}`) репо
автоматически обнуляет `tg_file_id` — следующая отправка снова заливает
файл и кэширует новый id.
"""
from __future__ import annotations

import logging
import os
from typing import Optional

from aiogram import types
from aiogram.exceptions import TelegramBadRequest
from aiogram.types import (
    FSInputFile,
    InlineKeyboardMarkup,
    InputMediaPhoto,
    ReplyKeyboardMarkup,
)
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database.repo.bot_media import BotMediaRepo

logger = logging.getLogger(__name__)

# Папка `uploads/` лежит в корне репозитория — `bot/` рядом, поднимаемся на 1 уровень.
_REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_UPLOADS_DIR = os.path.join(_REPO_ROOT, "uploads")


def _resolve_local_path(file_url: Optional[str]) -> Optional[str]:
    """`/uploads/abc.webp` -> абсолютный путь, если файл есть и внутри uploads."""
    if not file_url or not file_url.startswith("/uploads/"):
        return None
    rel = file_url[len("/uploads/"):]
    abs_path = os.path.abspath(os.path.join(_UPLOADS_DIR, rel))
    # Защита от path traversal: путь должен оставаться внутри uploads/.
    if not abs_path.startswith(os.path.abspath(_UPLOADS_DIR)):
        return None
    if not os.path.isfile(abs_path):
        return None
    return abs_path


def _extract_file_id(message: types.Message) -> Optional[str]:
    """Достаёт file_id из отправленного сообщения с фото.

    Берём самый большой превью (последний элемент `photo`) — у него
    максимальное разрешение, остальные размеры Telegram сгенерирует сам.
    """
    if message.photo:
        return message.photo[-1].file_id
    return None


async def send_with_media(
    message: types.Message,
    session: AsyncSession,
    *,
    media_key: str,
    text: str,
    reply_markup: InlineKeyboardMarkup | ReplyKeyboardMarkup | None = None,
) -> None:
    """Отправить text+kb. Если для `media_key` настроено фото — поверх caption."""
    repo = BotMediaRepo(session)
    media = await repo.get_by_key(media_key)

    if media is None:
        await message.answer(text, reply_markup=reply_markup)
        return

    # 1) Быстрый путь — отправка по кэшированному file_id.
    if media.tg_file_id:
        try:
            await message.answer_photo(
                photo=media.tg_file_id,
                caption=text,
                reply_markup=reply_markup,
            )
            return
        except TelegramBadRequest as e:
            # Самые частые причины: file_id протух (TG чистит редкие файлы),
            # бот сменил токен, файл удалён со стороны TG. Сбрасываем кэш и
            # падаем в путь 2 — заливку с диска. Commit сделает DbMiddleware
            # после хэндлера; промежуточный коммит здесь нежелателен — он
            # бы закрепил частичное состояние других репо в той же сессии.
            logger.info(
                "send_with_media(%s): tg_file_id невалиден, перезаливаю: %s",
                media_key, e,
            )
            await repo.set_tg_file_id(media_key, None)

    # 2) Заливка файла с диска + кэширование file_id.
    photo_path = _resolve_local_path(media.file_url)
    if photo_path:
        try:
            sent = await message.answer_photo(
                photo=FSInputFile(photo_path),
                caption=text,
                reply_markup=reply_markup,
            )
            file_id = _extract_file_id(sent)
            if file_id:
                try:
                    await repo.set_tg_file_id(media_key, file_id)
                except Exception as e:  # noqa: BLE001
                    logger.warning(
                        "send_with_media(%s): не удалось сохранить tg_file_id: %s",
                        media_key, e,
                    )
            return
        except Exception as e:  # noqa: BLE001 — fallback на текст
            logger.warning(
                "send_with_media(%s): отправка фото %s упала, fallback to text: %s",
                media_key, photo_path, e,
            )

    # 3) Финальный fallback.
    await message.answer(text, reply_markup=reply_markup)


async def _resolve_media_input(
    repo: BotMediaRepo, media_key: str
) -> tuple[str | FSInputFile | None, object | None]:
    """Возвращает (готовый к отправке media, объект БД).

    Приоритет: кэшированный `tg_file_id` → локальный файл → `(None, media)`.
    Если слота нет — `(None, None)`.
    """
    media = await repo.get_by_key(media_key)
    if media is None:
        return None, None
    if media.tg_file_id:
        return media.tg_file_id, media
    path = _resolve_local_path(media.file_url)
    if path:
        return FSInputFile(path), media
    return None, media


async def edit_with_media(
    callback: types.CallbackQuery,
    session: AsyncSession,
    *,
    media_key: str,
    text: str,
    reply_markup: InlineKeyboardMarkup | None = None,
) -> None:
    """Редактирует текущее сообщение, умеет менять фото между экранами.

    Сценарии:
      1. Текущее сообщение С фото + новый `media_key` с фото → `edit_media`
         (меняется и фото, и caption за один API-вызов). Кэшируем новый
         `tg_file_id` если заливали с диска.
      2. Текущее С фото + новый слот БЕЗ фото → `edit_caption` (фото
         остаётся, но это корректно — Telegram не даёт удалить media
         через edit, только через delete+send).
      3. Текущее БЕЗ фото + слот С фото → `delete` + `send_with_media`
         (нельзя «добавить» фото в текстовое сообщение через edit).
      4. Оба без фото → обычный `edit_text`.

    Все Telegram-ошибки логируются, на критических — fallback в п.4.
    """
    repo = BotMediaRepo(session)
    media_input, _media_obj = await _resolve_media_input(repo, media_key)

    msg = callback.message
    has_photo = bool(msg.photo)

    # 1) edit_media: есть фото и в текущем, и в новом слоте.
    if media_input is not None and has_photo:
        try:
            input_photo = InputMediaPhoto(media=media_input, caption=text)
            sent = await msg.edit_media(media=input_photo, reply_markup=reply_markup)
            # Кэшируем file_id, если заливали с диска (а не по tg_file_id).
            if isinstance(media_input, FSInputFile):
                file_id = _extract_file_id(sent) if hasattr(sent, "photo") else None
                if file_id:
                    try:
                        await repo.set_tg_file_id(media_key, file_id)
                    except Exception as e:  # noqa: BLE001
                        logger.warning(
                            "edit_with_media(%s): не удалось сохранить tg_file_id: %s",
                            media_key, e,
                        )
            return
        except TelegramBadRequest as e:
            # Чаще всего: tg_file_id протух или попытка отправить "ту же" картинку.
            logger.info("edit_with_media(%s): edit_media fail: %s", media_key, e)
            if isinstance(media_input, str):
                await repo.set_tg_file_id(media_key, None)
            # Не падаем — попробуем хотя бы обновить caption.
            try:
                await msg.edit_caption(caption=text, reply_markup=reply_markup)
            except TelegramBadRequest:
                pass
            return

    # 2) Текущее с фото, новый слот пустой — просто меняем caption.
    if media_input is None and has_photo:
        try:
            await msg.edit_caption(caption=text, reply_markup=reply_markup)
        except TelegramBadRequest as e:
            logger.info("edit_with_media(%s): edit_caption fail: %s", media_key, e)
        return

    # 3) Текущее без фото, новый слот с фото — пересоздаём сообщение.
    if media_input is not None and not has_photo:
        try:
            await msg.delete()
        except TelegramBadRequest:
            pass
        await send_with_media(
            msg, session,
            media_key=media_key, text=text, reply_markup=reply_markup,
        )
        return

    # 4) Оба без фото — обычный edit_text.
    try:
        await msg.edit_text(text=text, reply_markup=reply_markup)
    except TelegramBadRequest as e:
        logger.info("edit_with_media(%s): edit_text fail: %s", media_key, e)
