# handlers/profile/settings/language/change.py
from typing import Callable
from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.keyboards.profile import language_confirm_kb, language_inline_kb, settings_inline_kb
from bot.keyboards.main_menu import main_menu_kb
from bot.states import ProfileState
from shared.database.repo.users import UserRepo
from shared.utils.cache import set_user_lang
from shared.utils.i18n import i18n
from .helpers import get_lang_name, _edit_message

router = Router()

@router.callback_query(ProfileState.language, F.data.startswith("lang_"))
async def ask_confirm(callback: types.CallbackQuery, session: AsyncSession, _: Callable):
    target_lang_code = callback.data.split("_")[1]
    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    
    if user and user.language == target_lang_code:
        await callback.answer("Этот язык уже установлен", show_alert=False)
        return
        
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
    is_admin: bool = False,
):
    target_lang_code = callback.data.split("_")[2]
    repo = UserRepo(session)
    await repo.update_language(callback.from_user.id, target_lang_code)

    storage = state.storage
    redis = getattr(storage, "redis", None)
    if redis:
        await set_user_lang(redis, callback.from_user.id, target_lang_code)

    def new_i18n(key, **kwargs):
        return i18n.get(key, lang=target_lang_code, **kwargs)

    target_lang_name = get_lang_name(target_lang_code, new_i18n)
    await callback.answer(new_i18n("lang_selected", named_lang=target_lang_name))

    await state.set_state(ProfileState.settings)
    await _edit_message(
        callback,
        new_i18n("settings_title"),
        settings_inline_kb(new_i18n),
    )
    await callback.message.answer(
        new_i18n("lang_changed_success", named_lang=target_lang_name),
        reply_markup=main_menu_kb(new_i18n, callback.from_user.id, is_admin=is_admin),
    )
