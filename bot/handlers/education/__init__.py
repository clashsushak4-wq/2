# handlers/education/__init__.py
from aiogram import Router

from .main import router as education_main_router

router = Router()
router.include_router(education_main_router)

__all__ = ["router"]
