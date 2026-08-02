# handlers/keyboards/main_menu.py
from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder

def main_menu_kb(_: Callable, user_id: int, is_admin: bool | None = None) -> InlineKeyboardMarkup:
    """
    Главное меню в формате Inline.
    """
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_profile"), callback_data="nav_profile", icon_custom_emoji_id="5974048815789903111")
    builder.button(text=_("btn_education"), callback_data="nav_education")
    builder.button(text=_("btn_trading"), callback_data="nav_trading")
    builder.button(text=_("btn_info"), callback_data="nav_info")

    if is_admin:
        builder.button(text=_("btn_admin_panel"), callback_data="nav_admin")
        builder.adjust(2, 2, 1)
    else:
        builder.adjust(2, 2)

    return builder.as_markup()