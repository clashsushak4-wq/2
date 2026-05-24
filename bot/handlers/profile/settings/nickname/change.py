# handlers/profile/settings/nickname/change.py
import logging
import re
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.profile import confirm_nick_kb, settings_inline_kb
from bot.states import ProfileState
from shared.constants import NICKNAME_PATTERN
from shared.database.repo.users import UserRepo

logger = logging.getLogger(__name__)
router = Router()
NICK_REGEX = re.compile(NICKNAME_PATTERN)

@router.message(ProfileState.nick_change_input)
async def process_new_nick(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    nickname = message.text.strip() if message.text else ""
    if not NICK_REGEX.match(nickname):
        await message.answer(_("nick_invalid_format"))
        return

    repo = UserRepo(session)
    is_taken = await repo.is_nickname_taken(nickname)
    if is_taken:
        await message.answer(_("nick_taken", nickname=nickname))
        return

    await state.update_data(new_nick=nickname)
    await state.set_state(ProfileState.nick_change_confirm)

    await message.answer(
        text=_("nick_change_confirm", nickname=nickname),
        reply_markup=confirm_nick_kb(_),
    )

@router.callback_query(F.data == "confirm_new_nick", ProfileState.nick_change_confirm)
async def confirm_change(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    data = await state.get_data()
    new_nick = data.get("new_nick")
    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    old_nick = user.nickname if user else "Unknown"

    await repo.update_nickname(callback.from_user.id, new_nick)
    logger.info(
        f"[NICK_CHANGE] tg_id={callback.from_user.id}, "
        f"old_nick={old_nick}, new_nick={new_nick}"
    )

    await callback.message.edit_text(
        text=_("nick_change_success", nickname=new_nick),
        reply_markup=settings_inline_kb(_),
    )
    await state.set_state(ProfileState.settings)
    await callback.answer()

@router.callback_query(F.data == "cancel_change_nick")
async def cancel_change(
    callback: types.CallbackQuery,
    _: Callable,
    state: FSMContext,
):
    try:
        await callback.message.delete()
    except Exception:
        pass
        
    await state.set_state(ProfileState.settings)
    await callback.message.answer(
        text=_("settings_title"),
        reply_markup=settings_inline_kb(_),
    )
    await callback.answer()
