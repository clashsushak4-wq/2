from shared.utils.i18n import safe_emoji
# handlers/common/onboarding/nickname.py
import re
from typing import Callable
from aiogram import Router, F, types
from aiogram.fsm.context import FSMContext
from aiogram.utils.keyboard import InlineKeyboardBuilder 
from sqlalchemy.ext.asyncio import AsyncSession

from bot.states import OnboardingState
from bot.keyboards.main_menu import main_menu_kb
from .service import set_nickname
from shared.constants import NICKNAME_PATTERN

router = Router()
NICK_REGEX = re.compile(NICKNAME_PATTERN)

@router.message(OnboardingState.nickname_input)
async def process_nickname(message: types.Message, session: AsyncSession, _: Callable, state: FSMContext):
    nickname = message.text.strip() if message.text else ""
    data = await state.get_data()
    msg_id = data.get("onboarding_msg_id")

    # Удаляем сообщение пользователя с ником, чтобы чат был чистым
    try:
        await message.delete()
    except Exception:
        pass

    async def update_bot_msg(text, reply_markup=None):
        if not msg_id: return
        from aiogram.exceptions import TelegramBadRequest
        try:
            await message.bot.edit_message_caption(
                chat_id=message.chat.id, message_id=msg_id,
                caption=text, reply_markup=reply_markup
            )
        except TelegramBadRequest as e:
            if "not modified" in str(e).lower(): return
            try:
                await message.bot.edit_message_text(
                    chat_id=message.chat.id, message_id=msg_id,
                    text=text, reply_markup=reply_markup
                )
            except TelegramBadRequest:
                pass

    # Валидация
    if not NICK_REGEX.match(nickname):
        await update_bot_msg(_("nick_invalid_format") + "\n\n" + _("ask_nickname"))
        return

    # Сохраняем для подтверждения
    await state.update_data(pending_nickname=nickname)
    await state.set_state(OnboardingState.nickname_confirm)

    builder = InlineKeyboardBuilder()
    builder.button(text=_("nick_btn_confirm"), callback_data="nick_ok", icon_custom_emoji_id=safe_emoji(_("nick_btn_confirm_emoji")))
    builder.button(text=_("nick_btn_retry"), callback_data="nick_retry", icon_custom_emoji_id=safe_emoji(_("nick_btn_retry_emoji")))
    builder.adjust(1)

    await update_bot_msg(
        text=_("nick_confirm_ask", nickname=nickname),
        reply_markup=builder.as_markup()
    )


@router.callback_query(OnboardingState.nickname_confirm, F.data == "nick_retry")
async def retry_nickname(callback: types.CallbackQuery, _: Callable, state: FSMContext):
    await state.set_state(OnboardingState.nickname_input)
    from aiogram.exceptions import TelegramBadRequest
    try:
        await callback.message.edit_caption(caption=_("ask_nickname"))
    except TelegramBadRequest as e:
        if "not modified" in str(e).lower(): return
        try:
            await callback.message.edit_text(text=_("ask_nickname"))
        except TelegramBadRequest:
            pass


@router.callback_query(OnboardingState.nickname_confirm, F.data == "nick_ok")
async def confirm_nickname(callback: types.CallbackQuery, session: AsyncSession, _: Callable, state: FSMContext):
    data = await state.get_data()
    nickname = data.get("pending_nickname")

    # Проверяем уникальность ника ДО записи — избегаем IntegrityError + rollback,
    # который ломает состояние сессии для DbSessionMiddleware.
    from shared.database.repo.users import UserRepo
    repo = UserRepo(session)
    if await repo.is_nickname_taken(nickname):
        from aiogram.exceptions import TelegramBadRequest
        text_error = _("nick_taken", nickname=nickname) + "\n\n" + _("ask_nickname")
        try:
            await callback.message.edit_caption(caption=text_error)
        except TelegramBadRequest as e:
            if "not modified" not in str(e).lower():
                try:
                    await callback.message.edit_text(text=text_error)
                except TelegramBadRequest:
                    pass
        await state.set_state(OnboardingState.nickname_input)
        return

    await set_nickname(session, callback.from_user.id, nickname)
    await session.flush()
    
    await callback.message.delete()
    await state.clear()
    
    await callback.message.answer(
        text=_("nick_success", nickname=nickname),
        reply_markup=main_menu_kb(_, callback.from_user.id)
    )
