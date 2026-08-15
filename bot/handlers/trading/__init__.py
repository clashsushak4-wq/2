# handlers/trading/__init__.py
from aiogram import Router

from .main import router as trading_main_router

router = Router()
router.include_router(trading_main_router)

__all__ = ["router"]
