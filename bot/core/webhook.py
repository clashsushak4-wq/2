from shared.config import config
import logging

logger = logging.getLogger(__name__)

def check_webhook_conflict() -> bool:
    """Returns True if webhook is active and polling should be aborted."""
    if config.WEBHOOK_BASE_URL and config.WEBHOOK_BASE_URL.strip():
        logger.warning(
            "⏭️  WEBHOOK_BASE_URL задан в .env — polling отключён, чтобы не "
            "конфликтовать с webhook-режимом в backend. "
            "Обновления Telegram принимает `backend.bot_webhook` (FastAPI)."
        )
        logger.info("👋 bot.main завершён без запуска polling (webhook активен).")
        return True
    return False
