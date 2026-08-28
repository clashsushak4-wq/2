# handlers/common/navigation/onboarding.py
from aiogram import types
from aiogram.fsm.context import FSMContext
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession

from bot.states import OnboardingState
from bot.handlers.profile.settings.language.keyboards import language_inline_kb
from bot.utils.media import send_with_media
from shared.utils.i18n import i18n

async def _route_to_onboarding(message: types.Message, session: AsyncSession, _: Callable, state: FSMContext) -> None:
    await state.set_state(OnboardingState.language)
    await send_with_media(
        message,
        session,
        media_key="onboarding_welcome",
        text=i18n.get("welcome_select_language", lang="ru"),
        reply_markup=language_inline_kb(_, show_back=False),
    )
