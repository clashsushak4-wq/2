# handlers/trading/trading.py

# IMPORTS

from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Callable

from bot.filters.localized_text import LocalizedText
from bot.keyboards.trading import trading_main_inline_kb
from bot.handlers.common.back import back_registry
from bot.states import TradingState
from bot.utils.media import send_with_media, edit_with_media

router = Router()

# TRADING ENTRY

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

@router.message(LocalizedText("btn_trading"))
async def trading_entry(
    message: types.Message,
    session: AsyncSession,
    state: FSMContext,
    _: Callable,
):
    """Вход в раздел Trading по кнопке главного меню."""
    await state.set_state(TradingState.main)
    await send_with_media(
        message,
        session,
        media_key="trading_main",
        text=_("trading_title"),
        reply_markup=trading_main_inline_kb(_),
    )

# BACK REGISTRY

back_registry.register(TradingState, trading_entry)
