from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder
from shared.utils.i18n import i18n, safe_emoji

def language_inline_kb(_: Callable, show_back: bool = True) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    builder.button(text=_("lang_ru"), callback_data="lang_ru", icon_custom_emoji_id=safe_emoji(_("lang_ru_emoji")))
    builder.button(text=_("lang_en"), callback_data="lang_en", icon_custom_emoji_id=safe_emoji(_("lang_en_emoji")))
    builder.button(text=_("lang_ua"), callback_data="lang_ua", icon_custom_emoji_id=safe_emoji(_("lang_ua_emoji")))
    builder.button(text=_("lang_tr"), callback_data="lang_tr", icon_custom_emoji_id=safe_emoji(_("lang_tr_emoji")))
    
    if show_back:
        builder.button(text=_("btn_back"), callback_data="profile:back_to_settings", icon_custom_emoji_id=safe_emoji(_("btn_back_emoji")))
        builder.adjust(2, 2, 1)
    else:
        builder.adjust(2, 2)
        
    return builder.as_markup()

def language_confirm_kb(_: Callable, target_lang_code: str) -> InlineKeyboardMarkup:
    builder = InlineKeyboardBuilder()
    confirm_text = i18n.get("btn_confirm", lang=target_lang_code)
    cancel_text = _("btn_cancel")
    builder.button(text=confirm_text, callback_data=f"conf_lang_{target_lang_code}", icon_custom_emoji_id=safe_emoji(_("btn_confirm_emoji")))
    builder.button(text=cancel_text, callback_data="cancel_lang_change", icon_custom_emoji_id=safe_emoji(_("btn_cancel_emoji")))
    builder.adjust(1)
    return builder.as_markup()
