from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.utils.i18n import safe_emoji

def profile_main_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Инлайн-клавиатура карточки профиля (фото + ID/ник/...)."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_referral"), callback_data="profile:referral", icon_custom_emoji_id=safe_emoji(_("btn_referral_emoji")))
    builder.button(text=_("btn_settings"), callback_data="profile:settings", icon_custom_emoji_id=safe_emoji(_("btn_settings_emoji")))
    builder.button(text=_("btn_back"), callback_data="nav_main_menu", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()

def settings_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Инлайн-клавиатура меню Настроек."""
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_security"), callback_data="profile:security", icon_custom_emoji_id=safe_emoji(_("btn_security_emoji")))
    builder.button(text=_("btn_language"), callback_data="profile:language", icon_custom_emoji_id=safe_emoji(_("btn_language_emoji")))
    builder.button(text=_("btn_notifications"), callback_data="profile:notifications", icon_custom_emoji_id=safe_emoji(_("btn_notifications_emoji")))
    builder.button(text=_("btn_change_nick"), callback_data="profile:nickname", icon_custom_emoji_id=safe_emoji(_("btn_change_nick_emoji")))
    builder.button(text=_("btn_back"), callback_data="profile:back_to_main", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(2, 2, 1)
    return builder.as_markup()
