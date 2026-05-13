"""Полная очистка БД и Redis-кэша бота.

ВНИМАНИЕ: разрушительная операция. Удаляет ВСЕ строки из всех таблиц
(кроме alembic_version) и сбрасывает автоинкременты. Не трогает схему
и миграции — после очистки ничего не нужно мигрировать.

Использование (из корня проекта):
    python -m scripts.wipe_db --yes

Без --yes скрипт только покажет, что собирался сделать, и завершится.
"""
from __future__ import annotations

import argparse
import asyncio
import logging
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from shared.config import config

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("wipe_db")

# Порядок неважен — TRUNCATE ... CASCADE сам разрешит FK-зависимости.
TABLES = [
    "ticket_messages",
    "tickets",
    "trades",
    "home_tiles",
    "exchanges",
    "users",
]


async def wipe_postgres() -> None:
    engine = create_async_engine(config.DB_URL)
    try:
        async with engine.begin() as conn:
            tables_sql = ", ".join(TABLES)
            await conn.execute(text(f"TRUNCATE TABLE {tables_sql} RESTART IDENTITY CASCADE"))
        logger.info("PostgreSQL: TRUNCATE выполнен для %d таблиц", len(TABLES))
    finally:
        await engine.dispose()


async def wipe_redis() -> None:
    try:
        from redis.asyncio import Redis
    except ImportError:
        logger.warning("Redis: пакет redis не установлен — пропускаем")
        return

    client = Redis.from_url(config.REDIS_URL)
    try:
        await client.flushdb()
        logger.info("Redis: FLUSHDB выполнен (%s)", config.REDIS_URL)
    except Exception as e:
        logger.warning("Redis: ошибка FLUSHDB: %s", e)
    finally:
        await client.aclose()


async def main(confirm: bool) -> int:
    logger.info("Цель PG:    %s", _mask_db_url(config.DB_URL))
    logger.info("Цель Redis: %s", config.REDIS_URL)
    logger.info("Таблицы PG к очистке: %s", ", ".join(TABLES))

    if not confirm:
        logger.info("\nDRY RUN. Запусти с --yes чтобы выполнить очистку.")
        return 0

    logger.info("\nНачинаю очистку...")
    await wipe_postgres()
    await wipe_redis()
    logger.info("\nГотово. БД и Redis-кэш очищены.")
    return 0


def _mask_db_url(url: str) -> str:
    """Скрыть пароль в DB_URL для логирования."""
    if "://" not in url or "@" not in url:
        return url
    scheme, rest = url.split("://", 1)
    creds, host = rest.split("@", 1)
    if ":" in creds:
        user, _ = creds.split(":", 1)
        creds = f"{user}:***"
    return f"{scheme}://{creds}@{host}"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--yes", action="store_true", help="подтвердить выполнение")
    args = parser.parse_args()
    sys.exit(asyncio.run(main(confirm=args.yes)))
