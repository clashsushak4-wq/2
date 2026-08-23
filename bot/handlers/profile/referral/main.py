# handlers/profile/referral/main.py
from typing import Callable

from aiogram import F, Router, types
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.profile.referral.keyboards import referral_inline_kb
from bot.handlers.profile.referral.utils import build_referral_text
from bot.utils.media import edit_with_media
from shared.database.repo.users import UserRepo

router = Router()

@router.callback_query(F.data == "profile:referral")
async def show_referral_program(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
):
    """Открывает экран реферальной программы."""
    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    
    bot_info = await callback.bot.get_me()
    text = build_referral_text(bot_info.username, user, _)
    
    await edit_with_media(
        callback,
        session,
        media_key="profile_main",
        text=text,
        reply_markup=referral_inline_kb(_),
    )
    await callback.answer()
