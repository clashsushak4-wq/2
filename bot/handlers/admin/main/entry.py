# handlers/admin/main/entry_cb.py
from typing import Callable
from aiogram import types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.admin.keyboards.main import admin_main_kb
from bot.states import AdminState
from bot.utils.media import edit_with_media
from shared.utils.decorators import admin_required
from bot.handlers.admin.main.router import router

@router.callback_query(F.data == "nav_admin")
@admin_required
async def admin_panel_entry_cb(
    callback: types.CallbackQuery,
    session: AsyncSession,
    state: FSMContext,
    _: Callable,
    is_admin: bool,
):
    """Вход в админ-панель через инлайн-меню."""
    await state.set_state(AdminState.main)
    await edit_with_media(
        callback,
        session,
        media_key="admin_main",
        text=_("admin_panel_title"),
        reply_markup=admin_main_kb(_),
    )
    await callback.answer()
