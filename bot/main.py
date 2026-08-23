import asyncio

from shared.utils.asyncio_policy import apply_windows_event_loop_policy
from shared.utils.logger import setup_logger
from shared.utils.i18n import i18n
from bot.handlers.errors import register_error_handler
from bot.core.factory import build_bot, build_dispatcher, build_storage
from bot.core.commands import setup_bot_commands

from bot.core.webhook import check_webhook_conflict
from bot.core.env import validate_environment
from bot.core.runner import start_bot

logger = setup_logger()

async def main():
    logger.info("🚀 Запуск бота (polling-режим)...")

    if check_webhook_conflict():
        return

    validate_environment()
    i18n.load_locales()

    storage = await build_storage()
    bot = build_bot()
    dp = build_dispatcher(storage)

    register_error_handler(dp, bot)
    await setup_bot_commands(bot)

    await start_bot(bot, dp)

if __name__ == "__main__":
    apply_windows_event_loop_policy()

    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("👋 Бот выключен")
