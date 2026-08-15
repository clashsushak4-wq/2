# handlers/education/main/entry_cb.py
from typing import Callable
from aiogram import types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.education import education_main_inline_kb
from bot.states import EducationState
from bot.utils.media import edit_with_media
from bot.handlers.education.main.router import router

@router.callback_query(F.data == "nav_education")
async def education_entry_cb(
    callback: types.CallbackQuery,
    session: AsyncSession,
    state: FSMContext,
    _: Callable,
):
    """Вход в раздел Обучение через инлайн-меню."""
    await state.set_state(EducationState.main)
    await edit_with_media(
        callback,
        session,
        media_key="education_main",
        text=_("education_title"),
        reply_markup=education_main_inline_kb(_),
    )
    await callback.answer()
