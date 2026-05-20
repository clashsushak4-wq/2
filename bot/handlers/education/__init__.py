# handlers/education/__init__.py
from aiogram import Router

from . import education as education_main

router = Router()
router.include_router(education_main.router)

__all__ = ["router"]
