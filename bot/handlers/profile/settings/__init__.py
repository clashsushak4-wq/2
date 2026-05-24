# handlers/profile/settings/__init__.py
from aiogram import Router

from .settings import router as settings_main_router
from .language.router import router as language_router
from .nickname.router import router as nickname_router
from .notifications.notifications import router as notifications_router
from .security import router as security_router

router = Router()
router.include_router(language_router)
router.include_router(nickname_router)
router.include_router(notifications_router)
router.include_router(security_router)
router.include_router(settings_main_router)

__all__ = ["router"]
