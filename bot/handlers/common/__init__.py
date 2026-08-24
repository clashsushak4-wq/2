# handlers/common/__init__.py
from aiogram import Router

from .start import router as start_router
from .onboarding import router as onboarding_router
router = Router()
router.include_router(start_router)
router.include_router(onboarding_router)

__all__ = ["router"]
