"""
Bot commands setup.
"""

import logging

from aiogram import Bot
from aiogram.types import (
    BotCommand,
    BotCommandScopeAllGroupChats,
    BotCommandScopeDefault,
)

logger = logging.getLogger(__name__)

_START_COMMAND_DESCRIPTION = "Restart"


async def setup_bot_commands(bot: Bot) -> None:
    """Регистрирует команду /start в меню бота с описанием 'Restart'.
    """
    start_commands = [BotCommand(command="start", description=_START_COMMAND_DESCRIPTION)]

    try:
        await bot.set_my_commands(commands=start_commands, scope=BotCommandScopeDefault())
    except Exception as e:  # noqa: BLE001
        logger.warning("setup_bot_commands: default scope failed: %s", e)

    for lang in ("ru", "en", "uk", "tr"):
        try:
            await bot.delete_my_commands(scope=BotCommandScopeDefault(), language_code=lang)
        except Exception as e:  # noqa: BLE001
            logger.warning("setup_bot_commands: clear lang=%s failed: %s", lang, e)

    try:
        await bot.delete_my_commands(scope=BotCommandScopeAllGroupChats())
    except Exception as e:  # noqa: BLE001
        logger.warning("setup_bot_commands: group scope cleanup failed: %s", e)

    logger.info("✅ Bot commands menu configured (/start → Restart)")
