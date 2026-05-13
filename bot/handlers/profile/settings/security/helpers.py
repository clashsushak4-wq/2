# handlers/profile/settings/security/helpers.py
"""Общие хелперы раздела «Безопасность».

Содержит функции, которые переиспользуются между подмодулями
(`menu`, `set_password`, `change_password`, `sessions`, `logout_all`)
и поэтому вынесены в отдельный файл, чтобы избежать циклических
импортов и дублирования.
"""

from __future__ import annotations

import logging
from typing import Callable

from aiogram import types
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import security_inline_kb
from bot.utils_media import edit_with_media
from shared.database.repo.users import UserRepo

logger = logging.getLogger(__name__)


async def safe_delete(message: types.Message) -> None:
    """Удалить сообщение, проглатывая ошибки (best-effort)."""
    try:
        await message.delete()
    except Exception:  # noqa: BLE001 — best effort, не критично
        pass


async def render_security(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
) -> None:
    """Перерисовать главный экран «Безопасность» поверх текущего сообщения."""
    repo = UserRepo(session)
    has_password = await repo.has_password(callback.from_user.id)
    text_key = "security_title_set" if has_password else "security_title_empty"

    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=_(text_key),
        reply_markup=security_inline_kb(_, has_password),
    )


def password_invalid_text(_: Callable, error_key: str | None) -> str:
    """Подобрать корректный i18n-ключ для ошибки валидации пароля."""
    return _(f"security_password_{error_key}") if error_key else _("security_password_invalid")
