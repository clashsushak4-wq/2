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

    # Валидация
    if not NICK_REGEX.match(nickname):
        await message.answer(_("nick_invalid_format"))
        return

    # Сохраняем для подтверждения
    await state.update_data(pending_nickname=nickname)
    await state.set_state(OnboardingState.nickname_confirm)

    builder = InlineKeyboardBuilder()
    builder.button(text=_("nick_btn_confirm"), callback_data="nick_ok")
    builder.button(text=_("nick_btn_retry"), callback_data="nick_retry")
    builder.adjust(1)

    await message.answer(
        text=_("nick_confirm_ask", nickname=nickname),
        reply_markup=builder.as_markup()
    )


@router.callback_query(OnboardingState.nickname_confirm, F.data == "nick_retry")
async def retry_nickname(callback: types.CallbackQuery, _: Callable, state: FSMContext):
    await state.set_state(OnboardingState.nickname_input)
    await callback.message.edit_text(_("ask_nickname"))


@router.callback_query(OnboardingState.nickname_confirm, F.data == "nick_ok")
async def confirm_nickname(callback: types.CallbackQuery, session: AsyncSession, _: Callable, state: FSMContext):
    data = await state.get_data()
    nickname = data.get("pending_nickname")

    # Проверяем уникальность ника ДО записи — избегаем IntegrityError + rollback,
    # который ломает состояние сессии для DbSessionMiddleware.
    from shared.database.repo.users import UserRepo
    repo = UserRepo(session)
    if await repo.is_nickname_taken(nickname):
        await callback.message.edit_text(_("nick_taken", nickname=nickname))
        await state.set_state(OnboardingState.nickname_input)
        await callback.message.answer(_("ask_nickname"))
        return

    await set_nickname(session, callback.from_user.id, nickname)
    await session.flush()
    
    await callback.message.delete()
    await state.clear()
    
    await callback.message.answer(
        text=_("nick_success", nickname=nickname),
        reply_markup=main_menu_kb(_, callback.from_user.id)
    )
