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
    builder.button(text=_("btn_education"), callback_data="nav_education", icon_custom_emoji_id="6007996353261603963")
    builder.button(text=_("btn_trading"), callback_data="nav_trading", icon_custom_emoji_id="5974310710010711597")
    builder.button(text=_("btn_info"), callback_data="nav_info", icon_custom_emoji_id="5974193375799152241")

    if is_admin:
        builder.button(text=_("btn_admin_panel"), callback_data="nav_admin", icon_custom_emoji_id="5773798959206108871")
        builder.adjust(2, 2, 1)
    else:
        builder.adjust(2, 2)

    return builder.as_markup()