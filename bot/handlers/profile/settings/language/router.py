# handlers/profile/settings/language/router.py
from aiogram import Router
from . import menu
from . import change

router = Router()
router.include_router(menu.router)
router.include_router(change.router)
