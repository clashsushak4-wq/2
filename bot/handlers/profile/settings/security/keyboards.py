from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.utils.i18n import safe_emoji

def security_inline_kb(_: Callable, has_password: bool) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    if has_password:
        builder.button(text=_("btn_change_password"), callback_data="security:change", icon_custom_emoji_id=safe_emoji(_("btn_change_password_emoji")))
        builder.button(text=_("btn_sessions"), callback_data="security:sessions", icon_custom_emoji_id=safe_emoji(_("btn_sessions_emoji")))
        builder.button(text=_("btn_logout_all"), callback_data="security:logout_all", icon_custom_emoji_id=safe_emoji(_("btn_logout_all_emoji")))
    else:
        builder.button(text=_("btn_set_password"), callback_data="security:set", icon_custom_emoji_id=safe_emoji(_("btn_set_password_emoji")))
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()

def security_sessions_back_kb(_: Callable) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_back"), callback_data="security:sessions_back", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    return builder.as_markup()

def security_cancel_kb(_: Callable) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_cancel"), callback_data="security:cancel", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    return builder.as_markup()

def security_logout_all_confirm_kb(_: Callable) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_confirm"), callback_data="security:logout_all_confirm", icon_custom_emoji_id=safe_emoji(_("btn_confirm_emoji")))
    builder.button(text=_("btn_cancel"), callback_data="security:cancel", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    builder.adjust(1)
    return builder.as_markup()
