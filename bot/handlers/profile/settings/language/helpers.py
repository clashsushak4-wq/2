# handlers/profile/settings/language/helpers.py
from typing import Callable
from aiogram import types

def get_lang_name(lang_code: str, translate_func: Callable) -> str:
    names = {
        "ru": translate_func("lang_ru"),
        "ua": translate_func("lang_ua"),
        "en": translate_func("lang_en"),
        "tr": translate_func("lang_tr"),
    }
    return names.get(lang_code, lang_code)

async def _edit_message(callback: types.CallbackQuery, text: str, kb) -> None:
    """Редактирует caption если фото есть, иначе обычный text."""
    if callback.message.photo:
        await callback.message.edit_caption(caption=text, reply_markup=kb)
    else:
        await callback.message.edit_text(text=text, reply_markup=kb)
