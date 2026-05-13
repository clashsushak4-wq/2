# handlers/admin/keyboards/main.py

# IMPORTS

from typing import Callable
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

from shared.config import config

# ADMIN KEYBOARDS

def admin_main_kb(_: Callable) -> InlineKeyboardMarkup | None:
    """Inline-клавиатура главного меню админ-панели.

    Аналогично `profile_main_inline_kb`: висит под сообщением с фото
    (`media_key=admin_main`). Reply-клавиатура главного меню
    (`main_menu_kb`) остаётся на экране — через её кнопку «Назад»
    пользователь выходит в главное меню (см. `universal_back`).

    Возвращает `None`, если `WEBAPP_BASE_URL` не задан — Telegram
    отклоняет `InlineKeyboardMarkup` с пустым `inline_keyboard`.
    """
    webapp_url = (config.WEBAPP_BASE_URL or "").rstrip("/")
    if not webapp_url:
        return None

    admin_url = webapp_url.rsplit("/webapp", 1)[0] + "/admin/"
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text=_("btn_admin_web"),
                web_app=WebAppInfo(url=admin_url),
            ),
        ],
    ])


