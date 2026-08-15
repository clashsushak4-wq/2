# handlers/info/main/keyboards.py
from typing import Callable
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.utils.i18n import safe_emoji

def info_main_inline_kb(_: Callable):
    builder = InlineKeyboardBuilder()
    builder.button(
        text=_("btn_back"), 
        callback_data="nav_main_menu", 
        icon_custom_emoji_id=safe_emoji(_("btn_back_emoji"))
    )
    return builder.as_markup()
