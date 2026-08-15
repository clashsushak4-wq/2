# handlers/info/main/entry_cb.py
from typing import Callable
from aiogram import types, F
from sqlalchemy.ext.asyncio import AsyncSession

from bot.utils.media import edit_with_media
from bot.handlers.info.main.router import router
from bot.handlers.info.main.keyboards import info_main_inline_kb

@router.callback_query(F.data == "nav_info")
async def show_info_cb(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
):
    """Открывает карточку раздела «Информация» через инлайн-меню."""
    await edit_with_media(
        callback,
        session,
        media_key="info_main",
        text=_("info_main_text"),
        reply_markup=info_main_inline_kb(_),
    )
    await callback.answer()
