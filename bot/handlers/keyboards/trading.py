# handlers/keyboards/trading.py

from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def trading_main_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Inline-клавиатура главного экрана Trading.

    Пока пустая заглушка — кнопки будут добавлены позже.
    """
    builder = InlineKeyboardBuilder()
    builder.adjust(1)
    return builder.as_markup()
