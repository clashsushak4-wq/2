# database/repo/sessions.py
"""Repository для WebApp сессий."""

from __future__ import annotations

import logging
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy import delete, select, update
from sqlalchemy.exc import DatabaseError, OperationalError

from shared.database.models import UserSession
from shared.database.repo.base import BaseRepo
from shared.utils.exceptions import DatabaseException
from shared.utils.passwords import hash_token

logger = logging.getLogger(__name__)


class SessionRepo(BaseRepo):
    @staticmethod
    def generate_token() -> str:
        """Случайный URL-safe токен (40+ байт энтропии)."""
        return secrets.token_urlsafe(40)

    async def create_session(
        self,
        user_tg_id: int,
        ttl_days: int,
        user_agent: str | None = None,
    ) -> tuple[str, datetime]:
        """Создаёт новую сессию. Возвращает (открытый_токен, expires_at).

        Открытый токен возвращается ТОЛЬКО при создании, в БД хранится
        только sha256-хэш. Cleanup истёкших сессий лежит на caller'е.
        """
        token = self.generate_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=ttl_days)

        try:
            session = UserSession(
                user_tg_id=user_tg_id,
                token_hash=hash_token(token),
                expires_at=expires_at,
                last_used_at=datetime.now(timezone.utc),
                user_agent=user_agent[:255] if user_agent else None,
            )
            self.session.add(session)
            return token, expires_at
        except (OperationalError, DatabaseError) as e:
            logger.error(f"DB error creating session for tg_id={user_tg_id}: {e}")
            raise DatabaseException("Не удалось создать сессию")

    async def get_user_id_by_token(self, token: str) -> int | None:
        """Возвращает tg_id владельца, если токен валиден и не истёк."""
        if not token:
            return None
        token_h = hash_token(token)

        stmt = select(UserSession).where(UserSession.token_hash == token_h)
        result = await self.session.execute(stmt)
        record = result.scalar_one_or_none()
        if record is None:
            return None

        expires_at = record.expires_at
        if expires_at and expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at and expires_at <= datetime.now(timezone.utc):
            await self.delete_by_token(token)
            return None

        # Освежаем last_used_at чтобы видеть активные сессии
        await self.session.execute(
            update(UserSession)
            .where(UserSession.id == record.id)
            .values(last_used_at=datetime.now(timezone.utc))
        )
        return record.user_tg_id

    async def delete_by_token(self, token: str) -> None:
        if not token:
            return
        token_h = hash_token(token)
        await self.session.execute(
            delete(UserSession).where(UserSession.token_hash == token_h)
        )

    async def delete_all_for_user(self, user_tg_id: int) -> None:
        """Сносит все активные сессии пользователя (logout всех устройств)."""
        await self.session.execute(
            delete(UserSession).where(UserSession.user_tg_id == user_tg_id)
        )

    async def cleanup_expired(self) -> int:
        """Удаляет истёкшие сессии. Возвращает кол-во удалённых записей."""
        now = datetime.now(timezone.utc)
        result = await self.session.execute(
            delete(UserSession).where(UserSession.expires_at <= now)
        )
        return result.rowcount or 0

    async def list_for_user(self, user_tg_id: int) -> list[UserSession]:
        """Активные (не истёкшие) сессии пользователя, свежие сверху.

        Используется для отображения «Текущие сессии» в боте/WebApp.
        Истёкшие записи отфильтровываются на уровне SQL — их физическое
        удаление делает `cleanup_expired` (например периодической задачей).
        """
        now = datetime.now(timezone.utc)
        stmt = (
            select(UserSession)
            .where(UserSession.user_tg_id == user_tg_id)
            .where(UserSession.expires_at > now)
            .order_by(UserSession.last_used_at.desc().nullslast())
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
