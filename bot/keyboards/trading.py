from shared.utils.i18n import safe_emoji
# handlers/keyboards/trading.py

from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def trading_main_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Inline-клавиатура главного экрана Trading.
    """
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_back"), callback_data="nav_main_menu", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()
