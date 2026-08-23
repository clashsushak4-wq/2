# handlers/profile/main/entry_cb.py
from aiogram import types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Callable

from bot.handlers.profile.main.keyboards import profile_main_inline_kb
from bot.states import ProfileState
from bot.utils.media import edit_with_media
from shared.database.repo.users import UserRepo
from bot.handlers.profile.main.router import router
from bot.handlers.profile.main.utils import build_profile_text

@router.callback_query(F.data == "nav_profile")
async def show_profile(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Открывает карточку профиля через инлайн-меню."""
    await state.set_state(ProfileState.main)

    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    text = build_profile_text(callback.from_user.id, user, _)

    await edit_with_media(
        callback,
        session,
        media_key="profile_main",
        text=text,
        reply_markup=profile_main_inline_kb(_),
    )
    await callback.answer()
