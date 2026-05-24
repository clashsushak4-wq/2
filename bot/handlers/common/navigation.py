# handlers/common/navigation.py
import logging
from aiogram import types
from aiogram.fsm.context import FSMContext
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession

from bot.states import OnboardingState
from bot.keyboards.main_menu import main_menu_kb
from bot.keyboards.profile import language_inline_kb
from bot.handlers.common.start.service import get_or_create_user
from bot.utils.media import send_with_media
from shared.utils.i18n import i18n
from shared.database.repo.users import UserRepo

logger = logging.getLogger(__name__)

async def _notify_referrer(session: AsyncSession, bot, referrer_id: int) -> None:
    try:
        repo = UserRepo(session)
        referrer = await repo.get_user(referrer_id)
        if referrer:
            await bot.send_message(
                chat_id=referrer_id,
                text=i18n.get("new_referral_notification", lang=referrer.language)
            )
    except Exception as e:
        logger.warning(f"Не удалось отправить уведомление рефереру {referrer_id}: {e}")

async def _route_to_onboarding(message: types.Message, session: AsyncSession, _: Callable, state: FSMContext) -> None:
    await state.set_state(OnboardingState.language)
    await send_with_media(
        message,
        session,
        media_key="onboarding_welcome",
        text=i18n.get("welcome_select_language", lang="ru"),
        reply_markup=language_inline_kb(_, show_back=False),
    )

async def _route_to_main_menu(message: types.Message, _: Callable, user_nickname: str, is_admin: bool | None) -> None:
    await message.answer(
        text=_("start_back", nickname=user_nickname),
        reply_markup=main_menu_kb(_, message.from_user.id, is_admin=is_admin)
    )

async def nav_start(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
    start_args: str | None = None,
    is_admin: bool | None = None,
):
    """
    Универсальная функция перехода в главное меню.
    
    Используется командой /start и кнопкой 'Назад'.
    Для новых пользователей запускает onboarding.
    """
    # Сбрасываем старые состояния (например, если юзер был в середине процесса смены ника)
    current_state = await state.get_state()
    if current_state:
        await state.clear()

    # 1. Получаем или создаем юзера
    user, is_new = await get_or_create_user(
        session=session,
        tg_id=message.from_user.id,
        username=message.from_user.username,
        start_args=start_args
    )

    # 2. Маршрутизация
    if is_new or user.nickname is None:
        if is_new and user.referrer_id:
            await _notify_referrer(session, message.bot, user.referrer_id)
        await _route_to_onboarding(message, session, _, state)
    else:
        await _route_to_main_menu(message, _, user.nickname, is_admin)