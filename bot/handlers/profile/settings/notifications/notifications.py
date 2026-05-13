# handlers/profile/settings/notifications/notifications.py
"""Экран уведомлений. Открывается callback'ом `profile:notifications`
из меню Настроек, всё работает через редактирование того же сообщения.
"""

from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import notifications_kb
from bot.states import ProfileState
from shared.database.repo.users import UserRepo


router = Router()


async def _edit_message(callback: types.CallbackQuery, text: str, kb) -> None:
    """Редактирует caption если фото есть, иначе обычный text."""
    if callback.message.photo:
        await callback.message.edit_caption(caption=text, reply_markup=kb)
    else:
        await callback.message.edit_text(text=text, reply_markup=kb)


@router.callback_query(F.data == "profile:notifications")
async def show_notifications(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Настройки → Уведомления. Показывает текущий статус +
    переключатель + кнопку «Назад»."""
    await state.set_state(ProfileState.settings_notifications)

    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    if not user:
        await callback.answer()
        return

    status_text = _("notif_on") if user.notifications_enabled else _("notif_off")
    await _edit_message(
        callback,
        _("notif_title", status=status_text),
        notifications_kb(_, user.notifications_enabled),
    )
    await callback.answer()


@router.callback_query(F.data == "notif_disable", ProfileState.settings_notifications)
async def disable_notif(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
):
    repo = UserRepo(session)
    await repo.toggle_notifications(callback.from_user.id, False)

    await _edit_message(
        callback,
        _("notif_title", status=_("notif_off")),
        notifications_kb(_, False),
    )
    await callback.answer(_("notif_off"))


@router.callback_query(F.data == "notif_enable", ProfileState.settings_notifications)
async def enable_notif(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
):
    repo = UserRepo(session)
    await repo.toggle_notifications(callback.from_user.id, True)

    await _edit_message(
        callback,
        _("notif_title", status=_("notif_on")),
        notifications_kb(_, True),
    )
    await callback.answer(_("notif_on"))
