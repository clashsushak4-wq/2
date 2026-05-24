# handlers/common/onboarding/language.py
from typing import Callable
from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.i18n import i18n
from shared.utils.cache import set_user_lang
from bot.states import OnboardingState
from bot.utils.media import send_with_media
from .service import update_language

router = Router()

@router.callback_query(OnboardingState.language, F.data.startswith("lang_"))
async def language_selected(callback: types.CallbackQuery, session: AsyncSession, state: FSMContext):
    lang_code = callback.data.split("_")[1]
    
    # Сохраняем в БД
    await update_language(session, callback.from_user.id, lang_code)
    
    # ОБНОВЛЯЕМ КЕШ REDIS через утилиту
    storage = state.storage
    redis = getattr(storage, "redis", None)
    if redis:
        await set_user_lang(redis, callback.from_user.id, lang_code)
    
    # Хак для смены языка на лету
    def new_i18n(key, **kwargs):
        return i18n.get(key, lang=lang_code, **kwargs)

    lang_name = new_i18n(f"lang_{lang_code}")
    await callback.answer(new_i18n("lang_selected", named_lang=lang_name))
    
    # Переходим к вводу ника (с опциональным фото из админки)
    await state.set_state(OnboardingState.nickname_input)
    await callback.message.delete()
    await send_with_media(
        callback.message,
        session,
        media_key="nickname_create",
        text=new_i18n("ask_nickname"),
    )
