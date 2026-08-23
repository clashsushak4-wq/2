from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.utils.i18n import safe_emoji

def notifications_kb(_: Callable, is_enabled: bool) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    if is_enabled:
        text = _("btn_toggle_off")
        data = "notif_disable"
        emoji_id = safe_emoji(_("btn_toggle_off_emoji"))
    else:
        text = _("btn_toggle_on")
        data = "notif_enable"
        emoji_id = safe_emoji(_("btn_toggle_on_emoji"))
    builder.button(text=text, callback_data=data, icon_custom_emoji_id=emoji_id)
    builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
    builder.adjust(1)
    return builder.as_markup()
