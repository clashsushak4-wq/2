# handlers/info/__init__.py
from aiogram import Router

from .main import router as info_router

router = Router()
router.include_router(info_router)

__all__ = ["router"]
