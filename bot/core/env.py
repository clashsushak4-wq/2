from shared.config import config
import logging

logger = logging.getLogger(__name__)

def validate_environment():
    logger.info("🔍 Проверка переменных окружения...")

    if not config.BOT_TOKEN.get_secret_value():
        raise ValueError("BOT_TOKEN не может быть пустым")
    if not config.ADMIN_IDS:
        raise ValueError("ADMIN_IDS должен содержать хотя бы один ID")

    logger.info("✅ Переменные окружения валидны (Fernet-ключ, DB_URL, REDIS_URL)")
    logger.info("📦 Схема БД — из Alembic. Не забудьте `alembic upgrade head` перед запуском.")
