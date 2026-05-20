# handlers/education/education.py

# IMPORTS

from aiogram import Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Callable

from bot.filters.localized_text import LocalizedText
from bot.handlers.keyboards.education import education_main_inline_kb
from bot.handlers.common.back import back_registry
from bot.states import EducationState
from bot.utils_media import send_with_media

router = Router()

# EDUCATION ENTRY

@router.message(LocalizedText("btn_education"))
async def education_entry(
    message: types.Message,
    session: AsyncSession,
    state: FSMContext,
    _: Callable,
):
    """Вход в раздел Обучение по кнопке главного меню."""
    await state.set_state(EducationState.main)
    await send_with_media(
        message,
        session,
        media_key="education_main",
        text=_("education_title"),
        reply_markup=education_main_inline_kb(_),
    )

# BACK REGISTRY

back_registry.register(EducationState, education_entry)
