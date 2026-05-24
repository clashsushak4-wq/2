# handlers/__init__.py
from aiogram import Router

from .common import router as common_router
from .unknown import router as unknown_router
from .profile import router as profile_router
from .info import router as info_router
from .admin import router as admin_router
from .trading import router as trading_router
from .education import router as education_router

root_router = Router()
root_router.include_router(common_router)
root_router.include_router(profile_router)
root_router.include_router(info_router)
root_router.include_router(admin_router)
root_router.include_router(trading_router)
root_router.include_router(education_router)
# Fallback на нераспознанные сообщения — обязательно последним.
root_router.include_router(unknown_router)

__all__ = ["root_router"]
