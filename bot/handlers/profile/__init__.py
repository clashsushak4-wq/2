# handlers/profile/__init__.py
from aiogram import Router

from . import profile as profile_main
from .settings import router as settings_router

router = Router()
router.include_router(settings_router)
router.include_router(profile_main.router)

__all__ = ["router"]
