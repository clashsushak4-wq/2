# handlers/common/onboarding/router.py
from aiogram import Router
from . import language
from . import nickname

router = Router()
router.include_router(language.router)
router.include_router(nickname.router)