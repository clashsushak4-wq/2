# handlers/common/start/router.py
from aiogram import Router, types, F
from aiogram.filters import CommandStart, CommandObject
from aiogram.fsm.context import FSMContext
from typing import Callable
from sqlalchemy.ext.asyncio import AsyncSession

# Импортируем нашу новую функцию навигации
from bot.handlers.common.navigation import nav_start, nav_start_cb

router = Router()

@router.message(CommandStart())
async def cmd_start(
    message: types.Message, 
    session: AsyncSession, 
    _: Callable,
    is_admin: bool,
    state: FSMContext, 
    command: CommandObject = None 
):
    """
    Точка входа /start. 
    Теперь просто передает управление в навигатор.
    """
    args = command.args if command else None
    await nav_start(message, session, _, state, start_args=args, is_admin=is_admin)

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