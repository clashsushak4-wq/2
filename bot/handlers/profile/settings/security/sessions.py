# handlers/profile/settings/security/sessions.py
"""Список активных WebApp-сессий пользователя.

Хендлеры:
  * `security:sessions`       — открыть карточку со списком сессий
  * `security:sessions_back`  — вернуться в экран Безопасности

Данные читаются напрямую через `SessionRepo.list_for_user` — бот уже
имеет доступ к БД через `DbSession` middleware. Если когда-то WebApp
тоже захочет показывать список сессий, тот же репо переиспользуется
в API-эндпоинте без переделок.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import security_sessions_back_kb
from bot.states import ProfileState
from bot.utils_media import edit_with_media
from shared.database.models import UserSession
from shared.database.repo.sessions import SessionRepo
from shared.database.repo.users import UserRepo

from .helpers import render_security

logger = logging.getLogger(__name__)
router = Router()


def _parse_user_agent(ua: str | None) -> tuple[str, str]:
    """Очень упрощённый парсер UA → (icon, label).

    Не претендует на полноту — нужен только чтобы пользователь визуально
    понимал «это телефон или десктоп» и какой браузер. Для full-fledged
    парсинга есть библиотеки (user-agents и т.п.), но они тащат deps —
    избегаем ради 5 строк красоты.
    """
    if not ua:
        return "🖥", "Unknown device"

    low = ua.lower()

    # Платформа
    if "iphone" in low:
        icon, device = "📱", "iPhone"
    elif "ipad" in low:
        icon, device = "📱", "iPad"
    elif "android" in low:
        icon, device = "📱", "Android"
    elif "mobile" in low:
        icon, device = "📱", "Mobile"
    elif "windows" in low:
        icon, device = "🖥", "Windows"
    elif "macintosh" in low or "mac os" in low:
        icon, device = "🖥", "macOS"
    elif "linux" in low:
        icon, device = "🖥", "Linux"
    else:
        icon, device = "🖥", "Desktop"

    # Браузер (порядок важен — Edge/Chrome/Safari пересекаются по строкам)
    if "edg/" in low:
        browser = "Edge"
    elif "opr/" in low or "opera" in low:
        browser = "Opera"
    elif "firefox" in low:
        browser = "Firefox"
    elif "chrome" in low:
        browser = "Chrome"
    elif "safari" in low:
        browser = "Safari"
    else:
        browser = ""

    label = f"{device} · {browser}" if browser else device
    return icon, label


def _format_relative_time(_: Callable, dt: datetime | None) -> str:
    """Локализованное «X мин назад». i18n-ключи time_just_now/min/hours/days."""
    if dt is None:
        return "—"
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)

    delta = datetime.now(timezone.utc) - dt
    sec = int(delta.total_seconds())
    if sec < 0:
        sec = 0

    if sec < 60:
        return _("time_just_now")
    if sec < 3600:
        return _("time_min_ago").format(n=sec // 60)
    if sec < 86400:
        return _("time_hours_ago").format(n=sec // 3600)
    return _("time_days_ago").format(n=sec // 86400)


def _format_sessions_text(_: Callable, sessions: list[UserSession]) -> str:
    """Собирает HTML-текст карточки списка активных сессий."""
    if not sessions:
        return f"{_('security_sessions_title')}\n\n{_('security_sessions_empty')}"

    lines = [_("security_sessions_title"), ""]
    item_tpl = _("security_sessions_item")
    for s in sessions:
        icon, device = _parse_user_agent(s.user_agent)
        time_label = _format_relative_time(_, s.last_used_at)
        lines.append(item_tpl.format(icon=icon, device=device, time=time_label))
    return "\n".join(lines)


@router.callback_query(F.data == "security:sessions", ProfileState.security)
async def show_sessions(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Карточка со списком активных WebApp-сессий пользователя."""
    if not await UserRepo(session).has_password(callback.from_user.id):
        # Без пароля сессий быть не может — кнопка не должна была появиться,
        # но защищаемся на всякий случай.
        await callback.answer(_("security_no_password_yet"), show_alert=True)
        return

    sessions = await SessionRepo(session).list_for_user(callback.from_user.id)
    text = _format_sessions_text(_, sessions)

    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=text,
        reply_markup=security_sessions_back_kb(_),
    )
    await callback.answer()


@router.callback_query(F.data == "security:sessions_back", ProfileState.security)
async def back_to_security_from_sessions(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Возврат с карточки списка сессий обратно в раздел Безопасность."""
    await render_security(callback, session, _)
    await callback.answer()
