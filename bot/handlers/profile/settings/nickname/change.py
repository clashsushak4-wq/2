# handlers/profile/settings/nickname/change.py
import logging
import re
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.profile.settings.nickname.keyboards import confirm_nick_kb, cancel_nick_change_kb
from bot.handlers.profile.main.keyboards import settings_inline_kb
from bot.states import ProfileState
from shared.constants import NICKNAME_PATTERN
from shared.database.repo.users import UserRepo
from bot.utils.media import edit_message_with_media, edit_with_media
from contextlib import suppress
from aiogram.exceptions import TelegramBadRequest
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
    with suppress(TelegramBadRequest):
        await message.delete()
    
    data = await state.get_data()
    settings_msg_id = data.get("settings_msg_id")

    if not NICK_REGEX.match(nickname):
        if settings_msg_id:
            await edit_message_with_media(
                bot=message.bot, chat_id=message.chat.id, message_id=settings_msg_id,
                session=session, media_key="settings_main",
                text=_("nick_invalid_format"), reply_markup=cancel_nick_change_kb(_)
            )
        return

    repo = UserRepo(session)
    is_taken = await repo.is_nickname_taken(nickname)
    if is_taken:
        if settings_msg_id:
            await edit_message_with_media(
                bot=message.bot, chat_id=message.chat.id, message_id=settings_msg_id,
                session=session, media_key="settings_main",
                text=_("nick_taken", nickname=nickname), reply_markup=cancel_nick_change_kb(_)
            )
        return

    await state.update_data(new_nick=nickname)
    await state.set_state(ProfileState.nick_change_confirm)

    if settings_msg_id:
        await edit_message_with_media(
            bot=message.bot, chat_id=message.chat.id, message_id=settings_msg_id,
            session=session, media_key="settings_main",
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

    from sqlalchemy.exc import IntegrityError
    try:
        await repo.update_nickname(callback.from_user.id, new_nick)
        await session.flush()
    except IntegrityError:
        await session.rollback()
        await state.set_state(ProfileState.nick_change_input)
        await edit_with_media(
            callback, session,
            media_key="settings_main",
            text=_("nick_taken", nickname=new_nick),
            reply_markup=cancel_nick_change_kb(_)
        )
        await callback.answer()
        return

    logger.info(
        f"[NICK_CHANGE] tg_id={callback.from_user.id}, "
        f"old_nick={old_nick}, new_nick={new_nick}"
    )

    await edit_with_media(
        callback, session,
        media_key="settings_main",
        text=_("nick_change_success", nickname=new_nick),
        reply_markup=settings_inline_kb(_),
    )
    await state.set_state(ProfileState.settings)
    await callback.answer()


@router.callback_query(F.data == "cancel_change_nick")
async def cancel_change(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    await state.set_state(ProfileState.settings)
    await edit_with_media(
        callback, session,
        media_key="settings_main",
        text=_("settings_title"),
        reply_markup=settings_inline_kb(_),
    )
    await callback.answer()
