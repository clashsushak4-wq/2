# handlers/profile/profile.py
"""Главный экран Профиля.

Архитектура:
  * Вход — reply-кнопка `btn_profile` главного меню. Здесь отправляется
    новое сообщение с фото (`send_with_media('profile_main')`) и
    inline-клавой (`profile_main_inline_kb`).
  * Все вложенные экраны (Настройки/Язык/Ник/Уведомления) — это
    редактирование того же сообщения через callback-навигацию.
  * Возврат к карточке Профиля из Настроек — callback
    `profile:back_to_main` (`back_to_profile_main` ниже).

Сам показ карточки (build_profile_text + render_profile_card) вынесен
в отдельные функции, чтобы их могли переиспользовать sub-хэндлеры
(settings.py, language.py и т.д.) при нажатии «Назад».
"""

from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext
from sqlalchemy.ext.asyncio import AsyncSession

from bot.filters.localized_text import LocalizedText
from bot.handlers.keyboards.profile import profile_main_inline_kb
from bot.states import ProfileState
from bot.utils_media import edit_with_media, send_with_media
from shared.database.repo.users import UserRepo


router = Router()


def build_profile_text(message_or_callback_user_id: int, user, _: Callable) -> str:
    """Собирает текст карточки Профиля.

    Не зависит от того, пришёл ли user из `Message` или `CallbackQuery` —
    нужны только tg_id и объект пользователя из БД (или None).
    """
    if not user:
        nickname = "Unknown"
        username = "Unknown"
        reg_date = "N/A"
    else:
        nickname = user.nickname or _('no_username')
        username = f"@{user.username}" if user.username else _('no_username')
        reg_date = user.created_at.strftime('%Y-%m-%d')

    return (
        f"{_('profile_title')}\n\n"
        f"╔ <b>{_('label_id')}</b> <code>{message_or_callback_user_id}</code>\n"
        f"╠ <b>{_('label_nik')}</b> <code>#{nickname}</code>\n"
        f"╠ <b>{_('label_username')}</b> <code>{username}</code>\n"
        f"╚ <b>{_('label_reg')}</b> <code>{reg_date}</code>"
    )


# --- ENTRY: reply-кнопка «Профиль» ---

@router.message(LocalizedText("btn_profile"))
async def show_profile(
    message: types.Message,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Открывает карточку профиля. Это ЕДИНСТВЕННЫЙ handler, который
    отправляет НОВОЕ сообщение с медиа. Все следующие шаги навигации
    редактируют это сообщение через callback'и."""
    await state.set_state(ProfileState.main)

    repo = UserRepo(session)
    user = await repo.get_user(message.from_user.id)
    text = build_profile_text(message.from_user.id, user, _)

    await send_with_media(
        message,
        session,
        media_key="profile_main",
        text=text,
        reply_markup=profile_main_inline_kb(_),
    )


# --- BACK: возврат на карточку Профиля из Настроек ---

@router.callback_query(F.data == "profile:back_to_main")
async def back_to_profile_main(
    callback: types.CallbackQuery,
    session: AsyncSession,
    _: Callable,
    state: FSMContext,
):
    """Редактирует текущее сообщение (Настройки → Профиль).

    Меняет фото с settings_main обратно на profile_main через
    `edit_with_media` (один API-вызов на edit_media).
    """
    await state.set_state(ProfileState.main)

    repo = UserRepo(session)
    user = await repo.get_user(callback.from_user.id)
    text = build_profile_text(callback.from_user.id, user, _)

    await edit_with_media(
        callback,
        session,
        media_key="profile_main",
        text=text,
        reply_markup=profile_main_inline_kb(_),
    )
    await callback.answer()
