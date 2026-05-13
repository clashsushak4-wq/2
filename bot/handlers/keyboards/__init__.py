# handlers/keyboards/__init__.py
from bot.handlers.keyboards.main_menu import main_menu_kb
from bot.handlers.keyboards.profile import (
    profile_main_inline_kb, settings_inline_kb,
    language_inline_kb, language_confirm_kb,
    change_nick_start_kb, confirm_nick_kb,
    notifications_kb,
)
from bot.handlers.keyboards.common import common_back_kb

__all__ = [
    "main_menu_kb",
    "profile_main_inline_kb", "settings_inline_kb",
    "language_inline_kb", "language_confirm_kb",
    "change_nick_start_kb", "confirm_nick_kb",
    "notifications_kb",
    "common_back_kb",
]
