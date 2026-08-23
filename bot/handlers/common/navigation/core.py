# handlers/common/navigation/core.py
from aiogram import types
from aiogram.fsm.context import FSMContext
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.common.start.service import get_or_create_user
from bot.handlers.common.navigation.referral import _notify_referrer
from bot.handlers.common.navigation.onboarding import _route_to_onboarding
from bot.handlers.common.navigation.main_menu import _route_to_main_menu, _route_to_main_menu_cb

async def nav_start(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
    start_args: str | None = None,
    is_admin: bool | None = None,
):
    """Универсальная функция перехода в главное меню."""
    current_state = await state.get_state()
    if current_state:
        await state.clear()

    user, is_new = await get_or_create_user(
        session=session,
        tg_id=message.from_user.id,
        username=message.from_user.username,
        start_args=start_args
    )

    if is_new or user.nickname is None:
        if is_new and user.referrer_id:
            await _notify_referrer(session, message.bot, user.referrer_id)
        await _route_to_onboarding(message, session, _, state)
    else:
        await _route_to_main_menu(message, session, _, is_admin)

async def nav_start_cb(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
    start_args: str | None = None,
    is_admin: bool | None = None,
):
    """Версия nav_start для inline-кнопок Назад."""
    current_state = await state.get_state()
    if current_state:
        await state.clear()

    user, is_new = await get_or_create_user(
        session=session,
        tg_id=callback.from_user.id,
        username=callback.from_user.username,
        start_args=start_args
    )

    if is_new or user.nickname is None:
        if is_new and user.referrer_id:
            await _notify_referrer(session, callback.bot, user.referrer_id)
        try:
            await callback.message.delete()
        except Exception:
            pass
        from bot.handlers.common.navigation.onboarding import _route_to_onboarding
        await _route_to_onboarding(callback.message, session, _, state)
    else:
        await _route_to_main_menu_cb(callback, session, _, is_admin)
