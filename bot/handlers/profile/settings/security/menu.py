# handlers/profile/settings/security/menu.py
"""Главный экран «Безопасность»: вход, cancel, возврат в Настройки.

Хендлеры:
  * `profile:security`            — открыть экран безопасности
  * `security:cancel`             — возврат с ввода пароля обратно сюда
  * `profile:back_to_settings`    — выйти в раздел «Настройки»
"""

from __future__ import annotations

from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import security_inline_kb, settings_inline_kb
from bot.states import ProfileState
from bot.utils_media import edit_with_media
from shared.database.repo.users import UserRepo

from .helpers import render_security

router = Router()


@router.callback_query(F.data == "profile:security")
async def show_security(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    await state.set_state(ProfileState.security)
    await render_security(callback, session, _)
    await callback.answer()


@router.callback_query(F.data == "security:cancel")
async def cancel_to_security(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Возврат с любого экрана ввода пароля обратно в раздел Безопасность."""
    await state.set_state(ProfileState.security)
    has_password = await UserRepo(session).has_password(callback.from_user.id)
    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=_("security_cancelled"),
        reply_markup=security_inline_kb(_, has_password),
    )
    await callback.answer()


@router.callback_query(F.data == "profile:back_to_settings", ProfileState.security)
async def back_to_settings_from_security(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    await state.set_state(ProfileState.settings)
    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=_("settings_title"),
        reply_markup=settings_inline_kb(_),
    )
    await callback.answer()
