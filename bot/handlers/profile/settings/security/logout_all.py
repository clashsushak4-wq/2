# handlers/profile/settings/security/logout_all.py
"""Завершить все активные WebApp-сессии пользователя.

Хендлеры:
  * `security:logout_all`         — показать экран подтверждения
  * `security:logout_all_confirm` — подтвердить и снести все сессии
"""

from __future__ import annotations

import logging
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import security_logout_all_confirm_kb
from bot.states import ProfileState
from shared.database.repo.sessions import SessionRepo
from shared.database.repo.users import UserRepo

from .helpers import render_security

logger = logging.getLogger(__name__)
router = Router()


@router.callback_query(F.data == "security:logout_all", ProfileState.security)
async def start_logout_all(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    repo = UserRepo(session)
    if not await repo.has_password(callback.from_user.id):
        await callback.answer(_("security_no_password_yet"), show_alert=True)
        return

    if callback.message.photo:
        await callback.message.edit_caption(
            caption=_("security_logout_all_confirm"),
            reply_markup=security_logout_all_confirm_kb(_),
        )
    else:
        await callback.message.edit_text(
            _("security_logout_all_confirm"),
            reply_markup=security_logout_all_confirm_kb(_),
        )
    await callback.answer()


@router.callback_query(F.data == "security:logout_all_confirm", ProfileState.security)
async def confirm_logout_all(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    await SessionRepo(session).delete_all_for_user(callback.from_user.id)
    logger.info(f"[SECURITY_LOGOUT_ALL] tg_id={callback.from_user.id}")

    await callback.answer(_("security_logout_all_done"), show_alert=True)
    await render_security(callback, session, _)
