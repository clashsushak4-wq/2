# handlers/profile/settings/security/__init__.py
"""Пакет «Безопасность» в Настройках.

Каждый поток (создание пароля, смена, сессии, logout all) лежит в своём
модуле со своим Router. Здесь собираем их в один корневой router,
который подключается в `bot/handlers/profile/settings/__init__.py`.

Структура:
    menu.py             — главный экран, cancel, выход в Настройки
    set_password.py     — создание пароля
    change_password.py  — смена пароля
    sessions.py         — список активных WebApp-сессий
    logout_all.py       — завершение всех сессий
    helpers.py          — общие функции для всех модулей выше
"""

from aiogram import Router

from .change_password import router as change_password_router
from .logout_all import router as logout_all_router
from .menu import router as menu_router
from .sessions import router as sessions_router
from .set_password import router as set_password_router

router = Router()
router.include_routers(
    menu_router,
    set_password_router,
    change_password_router,
    sessions_router,
    logout_all_router,
)

__all__ = ["router"]
