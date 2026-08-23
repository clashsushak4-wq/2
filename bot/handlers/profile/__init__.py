# handlers/profile/__init__.py
from aiogram import Router

from .main import router as main_router
from .settings import router as settings_router
from .referral import router as referral_router

router = Router()
router.include_router(settings_router)
router.include_router(referral_router)
router.include_router(main_router)

__all__ = ["router"]
