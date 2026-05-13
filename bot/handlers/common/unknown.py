"""Fallback-обработчик для нераспознанных сообщений в личке.

Срабатывает на любое сообщение в private chat, которое не было
обработано предыдущими роутерами. Чтобы не ломать FSM-сценарии
(выбор языка, ввод ника, переписка с поддержкой), отвечаем только
если у юзера НЕТ активного состояния.

Этот роутер обязан подключаться ПОСЛЕДНИМ в дереве.
"""
from typing import Callable

from aiogram import F, Router, types
from aiogram.fsm.context import FSMContext

router = Router()


@router.message(F.chat.type == "private")
async def unknown_message(
    message: types.Message,
    state: FSMContext,
    _: Callable,
) -> None:
    # Если юзер в любом FSM-состоянии — пропускаем (его сообщение
    # должен был обработать handler состояния; если не обработал —
    # значит формат не подходит, и проще промолчать, чем спамить).
    if await state.get_state() is not None:
        return

    await message.answer(_("unknown_command"))
