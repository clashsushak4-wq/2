# handlers/info/__init__.py
from aiogram import Router

from . import info as info_main

router = Router()
router.include_router(info_main.router)

__all__ = ["router"]
