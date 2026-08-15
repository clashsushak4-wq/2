# handlers/admin/__init__.py

from aiogram import Router

from .main import router as admin_main_router

router = Router()
router.include_router(admin_main_router)

__all__ = ["router"]
