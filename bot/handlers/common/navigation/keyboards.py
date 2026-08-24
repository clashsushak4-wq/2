from shared.utils.i18n import safe_emoji
# handlers/keyboards/main_menu.py
from typing import Callable
from aiogram.types import InlineKeyboardMarkup, WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.config import config

def main_menu_kb(_: Callable, user_id: int, is_admin: bool | None = None) -> InlineKeyboardMarkup:
    """
    Главное меню в формате Inline.
    """
    builder = InlineKeyboardBuilder()
    
    webapp_url = config.WEBAPP_BASE_URL or "https://example.com"
    builder.button(
        text=_("btn_webapp"), 
        web_app=WebAppInfo(url=webapp_url),
        icon_custom_emoji_id=safe_emoji(_("btn_webapp_emoji"))
    )

    builder.button(text=_("btn_profile"), callback_data="nav_profile", icon_custom_emoji_id=safe_emoji(_("btn_profile_emoji")))
    builder.button(text=_("btn_education"), callback_data="nav_education", icon_custom_emoji_id=safe_emoji(_("btn_education_emoji")))
    builder.button(text=_("btn_trading"), callback_data="nav_trading", icon_custom_emoji_id=safe_emoji(_("btn_trading_emoji")))
    builder.button(text=_("btn_info"), callback_data="nav_info", icon_custom_emoji_id=safe_emoji(_("btn_info_emoji")))

    if is_admin:
        builder.button(text=_("btn_admin_panel"), callback_data="nav_admin", icon_custom_emoji_id=safe_emoji(_("btn_admin_panel_emoji")))
        builder.adjust(1, 2, 2, 1)
    else:
        builder.adjust(1, 2, 2)

    return builder.as_markup()