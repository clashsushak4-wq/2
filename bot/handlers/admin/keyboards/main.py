from shared.utils.i18n import safe_emoji
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

    Управление форум-темами в приватном чате с ботом сделано не
    кнопкой, а текстовой командой `/topic <название>` — см.
    `bot/handlers/admin/topics.py`.

    Возвращает `None`, если `WEBAPP_BASE_URL` не задан — Telegram
    отклоняет `InlineKeyboardMarkup` с пустым `inline_keyboard`.
    """
    webapp_url = (config.WEBAPP_BASE_URL or "").rstrip("/")
    admin_url = (config.ADMIN_WEBAPP_URL or "").rstrip("/") + "/"
    
    from aiogram.utils.keyboard import InlineKeyboardBuilder
    builder = InlineKeyboardBuilder()

    if webapp_url and admin_url and admin_url != "/":
        builder.button(
            text=_("btn_admin_web"),
            web_app=WebAppInfo(url=admin_url),
            icon_custom_emoji_id=safe_emoji(_("btn_admin_web_emoji"))
        )
        
    builder.button(text=_("btn_back"), callback_data="nav_main_menu", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    
    return builder.as_markup()


