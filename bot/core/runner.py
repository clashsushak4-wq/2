from aiogram import Bot, Dispatcher
from shared.lifecycle import shutdown_shared_resources
import logging

logger = logging.getLogger(__name__)

async def start_bot(bot: Bot, dp: Dispatcher):
    await bot.delete_webhook(drop_pending_updates=False)
    try:
        logger.info("✅ Бот запущен и готов к работе")
        await dp.start_polling(bot)
    except (KeyboardInterrupt, SystemExit):
        logger.info("⏸️ Получен сигнал остановки...")
    finally:
        await shutdown_shared_resources(bot=bot)
        logger.info("✅ Бот остановлен корректно")
