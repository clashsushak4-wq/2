# handlers/trading/__init__.py
from aiogram import Router

from . import trading as trading_main

router = Router()
router.include_router(trading_main.router)

__all__ = ["router"]
