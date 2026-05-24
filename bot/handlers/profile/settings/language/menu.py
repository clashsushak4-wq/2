# handlers/profile/settings/language/menu.py
from typing import Callable
from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.profile import language_inline_kb
from bot.states import ProfileState
from shared.database.repo.users import UserRepo
from .helpers import get_lang_name, _edit_message

router = Router()

@router.callback_query(F.data == "profile:language")
async def show_language(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    await state.set_state(ProfileState.language)
    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    current_lang = user.language if user else "ru"

    await _edit_message(
        callback,
        _("language_title", named_lang=get_lang_name(current_lang, _)),
        language_inline_kb(_),
    )
    await callback.answer()
