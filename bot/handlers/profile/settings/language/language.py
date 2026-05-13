# handlers/profile/settings/language/language.py
"""Экран выбора языка. Открывается callback'ом `profile:language`
из меню Настроек, всё происходит редактированием того же сообщения.

После подтверждения смены языка edit_caption/edit_text возвращает
сообщение в меню Настроек уже на новом языке.
"""

from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.handlers.keyboards.profile import (
    language_confirm_kb,
    language_inline_kb,
    settings_inline_kb,
)
from bot.states import ProfileState
from shared.database.repo.users import UserRepo
from shared.utils.cache import set_user_lang
from shared.utils.i18n import i18n


router = Router()


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


@router.callback_query(F.data == "profile:language")
async def show_language(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Настройки → Язык."""
    await state.set_state(ProfileState.language)

    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    current_lang = user.language if user else "ru"

    await _edit_message(
        callback,
        _("language_title", named_lang=get_lang_name(current_lang, _)),
        language_inline_kb(_),
    )
    await callback.answer()


@router.callback_query(ProfileState.language, F.data.startswith("lang_"))
async def ask_confirm(callback: types.CallbackQuery, _: Callable):
    """Выбран язык → запрос подтверждения."""
    target_lang_code = callback.data.split("_")[1]
    target_lang_name = get_lang_name(target_lang_code, _)

    await _edit_message(
        callback,
        _("ask_confirm_change", target_lang=target_lang_name),
        language_confirm_kb(_, target_lang_code),
    )
    await callback.answer()


@router.callback_query(ProfileState.language, F.data == "cancel_lang_change")
async def cancel_change(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
):
    """Отмена подтверждения → возврат к списку языков."""
    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    current_lang = user.language if user else "ru"

    await _edit_message(
        callback,
        _("language_title", named_lang=get_lang_name(current_lang, _)),
        language_inline_kb(_),
    )
    await callback.answer(_("btn_back"))


@router.callback_query(ProfileState.language, F.data.startswith("conf_lang_"))
async def confirm_change(
    callback: types.CallbackQuery,
    session: AsyncSession,
    state: FSMContext,
):
    """Подтверждение смены языка → save + возврат в Настройки."""
    target_lang_code = callback.data.split("_")[2]

    repo = UserRepo(session)
    await repo.update_language(callback.from_user.id, target_lang_code)

    # Инвалидируем кеш и сохраняем новый язык С TTL
    storage = state.storage
    redis = getattr(storage, "redis", None)
    if redis:
        await set_user_lang(redis, callback.from_user.id, target_lang_code)

    def new_i18n(key, **kwargs):
        return i18n.get(key, lang=target_lang_code, **kwargs)

    target_lang_name = get_lang_name(target_lang_code, new_i18n)

    await callback.answer(new_i18n("lang_selected", named_lang=target_lang_name))

    # Возвращаемся в Настройки, редактируя то же сообщение, но уже на новом языке.
    await state.set_state(ProfileState.settings)
    await _edit_message(
        callback,
        new_i18n("settings_title"),
        settings_inline_kb(new_i18n),
    )
