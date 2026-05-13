"""Высокоуровневая логика WebApp сессий поверх SessionRepo.

Хранение/проверка/удаление токенов и троттлинг логина.
"""

from __future__ import annotations

import time
from collections import defaultdict
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from shared.constants import WEBAPP_SESSION_TTL_DAYS
from shared.database.repo.sessions import SessionRepo


# Простой in-memory rate limiter на login-эндпоинт.
# 5 попыток на nickname + ip за 60 секунд.
_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 60
_login_attempts: dict[str, list[float]] = defaultdict(list)
_last_cleanup: float = 0.0
_CLEANUP_INTERVAL = 300


def _cleanup_attempts(now: float) -> None:
    global _last_cleanup
    if now - _last_cleanup <= _CLEANUP_INTERVAL:
        return
    stale_keys = [
        key for key, ts in _login_attempts.items() if all(now - t >= _WINDOW_SECONDS for t in ts)
    ]
    for key in stale_keys:
        del _login_attempts[key]
    _last_cleanup = now


def login_rate_limited(client_ip: str, nickname: str) -> bool:
    """True, если для пары (ip, nickname) лимит превышен."""
    now = time.monotonic()
    _cleanup_attempts(now)
    key = f"{client_ip}:{nickname.lower()}"
    attempts = [t for t in _login_attempts[key] if now - t < _WINDOW_SECONDS]
    if len(attempts) >= _MAX_ATTEMPTS:
        _login_attempts[key] = attempts
        return True
    attempts.append(now)
    _login_attempts[key] = attempts
    return False


def login_reset(client_ip: str, nickname: str) -> None:
    """Сбросить счётчик после успешного логина."""
    key = f"{client_ip}:{nickname.lower()}"
    _login_attempts.pop(key, None)


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
