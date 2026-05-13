# handlers/profile/settings/security/change_password.py
"""Смена пароля WebApp (когда пароль уже задан).

Поток FSM:
  security:change (callback)
    → state=security_password_change_old   (вводит текущий пароль)
       → state=security_password_change_new   (новый пароль)
          → state=security_password_change_confirm  (повтор нового)
             → пароль обновлён, все сессии сброшены, возврат в Безопасность.

Сообщения с введёнными паролями немедленно удаляются.
"""

from __future__ import annotations

import logging
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import security_cancel_kb, security_inline_kb
from bot.states import ProfileState
from bot.utils_media import edit_with_media
from shared.database.repo.sessions import SessionRepo
from shared.database.repo.users import UserRepo
from shared.utils.passwords import validate_password_format

from .helpers import password_invalid_text, safe_delete

logger = logging.getLogger(__name__)
router = Router()


@router.callback_query(F.data == "security:change", ProfileState.security)
async def start_change_password(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    repo = UserRepo(session)
    if not await repo.has_password(callback.from_user.id):
        await callback.answer(_("security_no_password_yet"), show_alert=True)
        return

    await state.set_state(ProfileState.security_password_change_old)
    await edit_with_media(
        callback,
        session,
        media_key="settings_main",
        text=_("security_change_ask_old"),
        reply_markup=security_cancel_kb(_),
    )
    await callback.answer()


@router.message(ProfileState.security_password_change_old)
async def process_change_old(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    old_password = message.text or ""
    await safe_delete(message)

    repo = UserRepo(session)
    if not await repo.verify_password(message.from_user.id, old_password):
        await message.answer(
            _("security_old_password_wrong"),
            reply_markup=security_cancel_kb(_),
        )
        return

    await state.set_state(ProfileState.security_password_change_new)
    await message.answer(_("security_change_ask_new"), reply_markup=security_cancel_kb(_))


@router.message(ProfileState.security_password_change_new)
async def process_change_new(
    message: types.Message,
    _: Callable,
    state: FSMContext,
):
    password = message.text or ""
    await safe_delete(message)

    ok, error = validate_password_format(password)
    if not ok:
        await message.answer(
            password_invalid_text(_, error),
            reply_markup=security_cancel_kb(_),
        )
        return

    await state.update_data(pending_password=password)
    await state.set_state(ProfileState.security_password_change_confirm)
    await message.answer(
        _("security_change_confirm_ask"),
        reply_markup=security_cancel_kb(_),
    )


@router.message(ProfileState.security_password_change_confirm)
async def process_change_confirm(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    confirm_password = message.text or ""
    await safe_delete(message)

    data = await state.get_data()
    pending = data.get("pending_password")
    if not pending:
        await state.set_state(ProfileState.security)
        await message.answer(_("security_session_expired"))
        return

    if confirm_password != pending:
        await message.answer(
            _("security_password_mismatch"),
            reply_markup=security_cancel_kb(_),
        )
        return

    repo = UserRepo(session)
    await repo.set_password(message.from_user.id, pending)
    await SessionRepo(session).delete_all_for_user(message.from_user.id)

    await state.update_data(pending_password=None)
    await state.set_state(ProfileState.security)
    logger.info(f"[SECURITY_CHANGE] tg_id={message.from_user.id}")

    await message.answer(
        _("security_change_success"),
        reply_markup=security_inline_kb(_, has_password=True),
    )
