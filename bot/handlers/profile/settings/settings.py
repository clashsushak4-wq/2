# handlers/profile/settings/settings.py
"""Экран Настроек Профиля.

Открывается callback'ом `profile:settings` из карточки Профиля.
Все 3 sub-кнопки (Язык/Ник/Уведомления) и кнопка «Назад» — это
тоже callback'и, обрабатываемые либо здесь (`back_to_settings`),
либо в подмодулях.
"""

from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext

from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import settings_inline_kb
from bot.states import ProfileState
from bot.utils_media import edit_with_media


router = Router()


async def render_settings(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
) -> None:
    """Рендер меню Настроек поверх существующего сообщения.

    При входе из карточки Профиля меняется и фото (profile_main →
    settings_main) через `edit_media`. При возврате из подэкранов
    (Язык/Ник/Уведомления), где фото уже settings_main, edit_media
    тоже вызывается — Telegram умеет возвращать «такое же» фото
    через кэш file_id, что дёшево.
    """
    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=_("settings_title"),
        reply_markup=settings_inline_kb(_),
    )


@router.callback_query(F.data == "profile:settings")
async def show_settings(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Карточка профиля → Настройки (фото меняется на settings_main)."""
    await state.set_state(ProfileState.settings)
    await render_settings(callback, session, _)
    await callback.answer()


@router.callback_query(F.data == "profile:back_to_settings")
async def back_to_settings(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """«Назад» из подэкранов (Язык/Ник/Уведомления) → Настройки."""
    await state.set_state(ProfileState.settings)
    await render_settings(callback, session, _)
    await callback.answer()
