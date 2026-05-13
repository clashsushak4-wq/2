# handlers/admin/panel.py

# IMPORTS

from aiogram import Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Callable

from bot.filters.localized_text import LocalizedText
from bot.handlers.admin.keyboards.main import admin_main_kb
from bot.handlers.common.back import back_registry
from bot.states import AdminState
from bot.utils_media import send_with_media
from shared.utils.decorators import admin_required

router = Router()

# ADMIN PANEL ENTRY

@router.message(LocalizedText("btn_admin_panel"))
@admin_required
async def admin_panel_entry(
    message: types.Message,
    session: AsyncSession,
    state: FSMContext,
    _: Callable,
    is_admin: bool,
):
    """Вход в админ-панель по кнопке «Админ панель» в главном меню.

    Паттерн как у раздела Профиль: отправляется новое сообщение с фото
    (`media_key=admin_main`, настраивается в веб-админке) и inline-
    клавиатурой под ним. Reply-клавиатура главного меню остаётся на
    экране — через её кнопку «Назад» пользователь выходит в главное меню
    (см. `universal_back`, явная проверка на `AdminState:main`).
    """
    await state.set_state(AdminState.main)
    await send_with_media(
        message,
        session,
        media_key="admin_main",
        text=_("admin_panel_title"),
        reply_markup=admin_main_kb(_),
    )

# BACK REGISTRY

back_registry.register(AdminState, admin_panel_entry)