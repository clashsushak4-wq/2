# handlers/keyboards/education.py

from typing import Callable
from aiogram.types import InlineKeyboardMarkup
from aiogram.utils.keyboard import InlineKeyboardBuilder


def education_main_inline_kb(_: Callable) -> InlineKeyboardMarkup:
    """Inline-клавиатура главного экрана Обучения.

    Пока пустая заглушка — кнопки будут добавлены позже.
    """
    builder = InlineKeyboardBuilder()
    builder.adjust(1)
    return builder.as_markup()
