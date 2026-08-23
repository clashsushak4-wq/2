from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.utils.i18n import safe_emoji

def change_nick_start_kb(_: Callable) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_change_nick_action"), callback_data="start_change_nick", icon_custom_emoji_id=safe_emoji(_("btn_change_nick_action_emoji")))
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()

def cancel_nick_change_kb(_: Callable) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=_("btn_cancel"), callback_data="cancel_change_nick", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    return builder.as_markup()

def confirm_nick_kb(_: Callable) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=_("nick_btn_confirm"), callback_data="confirm_new_nick", icon_custom_emoji_id=safe_emoji(_("nick_btn_confirm_emoji")))
    builder.button(text=_("btn_cancel"), callback_data="cancel_change_nick", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    builder.adjust(1)
    return builder.as_markup()
