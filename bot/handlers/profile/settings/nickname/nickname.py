# handlers/profile/settings/nickname/nickname.py
"""Экран смены ника. Iерархия:

  Настройки (callback `profile:nickname`)
    └─ Карточка ника + кнопка «Изменить сейчас»
       └─ Запрос ввода (state=nick_change_input)
          └─ Юзер вводит ник (message)
             └─ Подтверждение (state=nick_change_confirm)
                ├─ Подтвердить → save + возврат в Настройки
                └─ Отмена → возврат в Настройки

После запроса ввода юзер посылает обычное message-сообщение с ником —
тут редактирование того же inline-сообщения невозможно (мы не можем
ответить на text-сообщение редактированием), поэтому отправляется
НОВОЕ сообщение с подтверждением. Это нормально для редкой операции.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import (
    change_nick_start_kb,
    confirm_nick_kb,
    settings_inline_kb,
)
from bot.states import ProfileState
from shared.constants import NICKNAME_CHANGE_COOLDOWN_DAYS, NICKNAME_PATTERN
from shared.database.repo.users import UserRepo


logger = logging.getLogger(__name__)

router = Router()
NICK_REGEX = re.compile(NICKNAME_PATTERN)


async def _edit_message(callback: types.CallbackQuery, text: str, kb) -> None:
    """Редактирует caption если фото есть, иначе обычный text."""
    if callback.message.photo:
        await callback.message.edit_caption(caption=text, reply_markup=kb)
    else:
        await callback.message.edit_text(text=text, reply_markup=kb)


@router.callback_query(F.data == "profile:nickname")
async def show_nick_info(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Настройки → Никнейм. Показывает карточку с текущим ником и
    датой последнего изменения + кнопки «Изменить сейчас» / «Назад»."""
    # Состояние ставим в settings, чтобы handler `start_change_nick`
    # (callback "start_change_nick") отрабатывал — он фильтруется на ProfileState.settings.
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

    await _edit_message(
        callback,
        _("nick_info_title", nickname=nickname, date=date_str),
        change_nick_start_kb(_),
    )
    await callback.answer()


@router.callback_query(F.data == "start_change_nick", ProfileState.settings)
async def start_change_nick(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Проверяет cooldown и запускает ввод нового ника."""
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
    # Удаляем фото-сообщение и шлём текстовый запрос — иначе фото будет
    # висеть пока юзер не отправит ник, что выглядит странно.
    await callback.message.delete()
    await callback.message.answer(_("nick_change_ask"))
    await callback.answer()


@router.message(ProfileState.nick_change_input)
async def process_new_nick(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Обрабатывает ввод нового ника и проверяет его уникальность."""
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
    """Подтверждает смену ника. Возврат в Настройки — НОВЫМ сообщением,
    т.к. это сообщение про подтверждение появилось после ввода юзером
    текста (фото в нём нет, и редактировать его в карточку Профиля
    не имеет смысла — юзер всё равно ушёл из исходного flow)."""
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


@router.callback_query(F.data == "cancel_change_nick", ProfileState.nick_change_confirm)
async def cancel_change(
    callback: types.CallbackQuery,
    _: Callable,
    state: FSMContext,
):
    """Отмена подтверждения → возврат в Настройки."""
    await callback.message.edit_text(
        text=_("settings_title"),
        reply_markup=settings_inline_kb(_),
    )
    await state.set_state(ProfileState.settings)
    await callback.answer()
