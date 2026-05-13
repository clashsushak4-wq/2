# utils/exceptions.py
"""
Кастомные исключения для проекта бота.
"""


class BotException(Exception):
    """Базовое исключение для всех ошибок бота."""
    pass


class DatabaseException(BotException):
    """Исключение при работе с базой данных."""
    pass


class ValidationException(BotException):
    """Ошибка валидации данных."""
    pass
