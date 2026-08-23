from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.utils.i18n import safe_emoji

def referral_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Инлайн-клавиатура для экрана реферальной программы."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_back"), callback_data="nav_profile", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    return builder.as_markup()
