# handlers/common/back/router.py
import inspect
from aiogram import Router, types, F
from aiogram.fsm.context import FSMContext
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession

from .registry import back_registry
from bot.handlers.common.navigation import nav_start, nav_start_cb
from shared.utils.logger import setup_logger

logger = setup_logger()

router = Router()

@router.callback_query(F.data == "nav_main_menu")
async def nav_main_menu_handler(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
    is_admin: bool | None = None,
):
    await nav_start_cb(callback, session, _, state, is_admin=is_admin)
    await callback.answer()