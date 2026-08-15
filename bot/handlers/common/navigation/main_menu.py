# handlers/common/navigation/main_menu.py
from aiogram import types
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.main_menu import main_menu_kb
from bot.utils.media import send_with_media, edit_with_media

async def _route_to_main_menu(message: types.Message, session: AsyncSession, _: Callable, is_admin: bool | None) -> None:
    await send_with_media(
        message,
        session,
        media_key="start_main",
        text=_("start_main_text"),
        reply_markup=main_menu_kb(_, message.from_user.id, is_admin=is_admin)
    )

async def _route_to_main_menu_cb(callback: types.CallbackQuery, session: AsyncSession, _: Callable, is_admin: bool | None) -> None:
    await edit_with_media(
        callback,
        session,
        media_key="start_main",
        text=_("start_main_text"),
        reply_markup=main_menu_kb(_, callback.from_user.id, is_admin=is_admin)
    )
