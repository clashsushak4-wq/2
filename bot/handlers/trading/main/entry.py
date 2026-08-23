# handlers/trading/main/entry_cb.py
from typing import Callable
from aiogram import types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.trading.keyboards import trading_main_inline_kb
from bot.states import TradingState
from bot.utils.media import edit_with_media
from bot.handlers.trading.main.router import router

@router.callback_query(F.data == "nav_trading")
async def trading_entry_cb(
    callback: types.CallbackQuery,
    session: AsyncSession,
    state: FSMContext,
    _: Callable,
):
    """Вход в раздел Trading через инлайн-меню."""
    await state.set_state(TradingState.main)
    await edit_with_media(
        callback,
        session,
        media_key="trading_main",
        text=_("trading_title"),
        reply_markup=trading_main_inline_kb(_),
    )
    await callback.answer()
