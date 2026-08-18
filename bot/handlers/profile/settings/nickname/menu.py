# handlers/profile/settings/nickname/menu.py
import logging
from datetime import datetime, timezone
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.profile import change_nick_start_kb, cancel_nick_change_kb
from bot.utils.media import edit_with_media
from bot.states import ProfileState
from shared.constants import NICKNAME_CHANGE_COOLDOWN_DAYS
from shared.database.repo.users import UserRepo

logger = logging.getLogger(__name__)
router = Router()


@router.callback_query(F.data == "profile:nickname")
async def show_nick_info(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    await state.set_state(ProfileState.settings)
    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)

    if user and user.nickname_updated_at:
        date_str = user.nickname_updated_at.strftime('%d.%m.%Y')
    elif user:
        date_str = user.created_at.strftime('%d.%m.%Y')
    else:
        date_str = "—"

    nickname = user.nickname if user else "—"

    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=_("nick_info_title", nickname=nickname, date=date_str),
        reply_markup=change_nick_start_kb(_),
    )
    await callback.answer()

@router.callback_query(F.data == "start_change_nick", ProfileState.settings)
async def start_change_nick(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)

    if user and user.nickname_updated_at:
        last_update = user.nickname_updated_at
        if last_update.tzinfo is None:
            last_update = last_update.replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        delta = now - last_update

        if delta.days < NICKNAME_CHANGE_COOLDOWN_DAYS:
            days_left = NICKNAME_CHANGE_COOLDOWN_DAYS - delta.days
            logger.warning(
                f"[COOLDOWN_BLOCK] tg_id={callback.from_user.id}, "
                f"action=nick_change, days_left={days_left}"
            )
            await callback.answer(_("nick_cooldown_error", days=days_left), show_alert=True)
            return

    await state.set_state(ProfileState.nick_change_input)
    await state.update_data(settings_msg_id=callback.message.message_id)
    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=_("nick_change_ask"),
        reply_markup=cancel_nick_change_kb(_),
    )
    await callback.answer()
