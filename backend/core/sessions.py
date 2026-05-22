"""Высокоуровневая логика WebApp сессий поверх SessionRepo.

Хранение/проверка/удаление токенов и троттлинг логина.
"""

from __future__ import annotations

import time
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as redis

from shared.config import config

from shared.constants import WEBAPP_SESSION_TTL_DAYS
from shared.database.repo.sessions import SessionRepo


_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 60

redis_client = redis.from_url(
    config.REDIS_URL.get_secret_value() if hasattr(config.REDIS_URL, "get_secret_value") else config.REDIS_URL,
    decode_responses=True
)


async def login_rate_limited(client_ip: str, nickname: str) -> bool:
    """True, если для пары (ip, nickname) лимит превышен."""
    key = f"rate_limit:login:{client_ip}:{nickname.lower()}"
    
    async with redis_client.pipeline(transaction=True) as pipe:
        await pipe.incr(key)
        # Ставим TTL, только если ключа не было (для первого инкремента)
        # Если redis-py < 4.2 не поддерживает nx=True в expire,
        # то можно использовать expire(key, _WINDOW_SECONDS)
        # Но в современных версиях это работает, или проще ставить TTL всегда, 
        # продлевая блокировку при спаме (что даже лучше).
        await pipe.expire(key, _WINDOW_SECONDS)
        results = await pipe.execute()
        
    attempts = results[0]
    return attempts > _MAX_ATTEMPTS


async def login_reset(client_ip: str, nickname: str) -> None:
    """Сбросить счётчик после успешного логина."""
    key = f"rate_limit:login:{client_ip}:{nickname.lower()}"
    await redis_client.delete(key)


async def issue_session_token(
    db: AsyncSession,
    user_tg_id: int,
    user_agent: Optional[str] = None,
    ttl_days: int = WEBAPP_SESSION_TTL_DAYS,
) -> tuple[str, datetime]:
    """Создаёт сессию и возвращает (token, expires_at)."""
    repo = SessionRepo(db)
    return await repo.create_session(user_tg_id, ttl_days=ttl_days, user_agent=user_agent)


async def resolve_session_token(db: AsyncSession, token: str) -> Optional[int]:
    """Возвращает tg_id или None, если токен недействителен."""
    repo = SessionRepo(db)
    return await repo.get_user_id_by_token(token)


async def revoke_session_token(db: AsyncSession, token: str) -> None:
    repo = SessionRepo(db)
    await repo.delete_by_token(token)


async def revoke_all_user_sessions(db: AsyncSession, user_tg_id: int) -> None:
    repo = SessionRepo(db)
    await repo.delete_all_for_user(user_tg_id)
