# database/repo/bot_media.py
"""Repository для медиа-слотов бота (BotMedia)."""

from typing import List, Optional

from sqlalchemy import delete, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.sql import func

from shared.database.models.bot_media import BotMedia
from shared.database.repo.base import BaseRepo


class BotMediaRepo(BaseRepo):
    async def get_by_key(self, key: str) -> Optional[BotMedia]:
        stmt = select(BotMedia).where(BotMedia.key == key)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self) -> List[BotMedia]:
        stmt = select(BotMedia).order_by(BotMedia.key)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def upsert(
        self,
        key: str,
        file_url: str,
        thumb_url: Optional[str] = None,
    ) -> BotMedia:
        """Установить или обновить файл для слота.

        ВАЖНО: при апсерте `tg_file_id` всегда сбрасывается в NULL —
        новый файл = новый file_id, старый кэш стал невалидным.

        На PostgreSQL используем `ON CONFLICT (key) DO UPDATE` чтобы
        атомарно обновить поля и `updated_at`. Для совместимости
        с SQLite-тестами — fallback на ручной select+update/insert.
        """
        bind = self.session.bind
        if bind is None or bind.dialect.name == "postgresql":
            stmt = pg_insert(BotMedia).values(
                key=key,
                file_url=file_url,
                thumb_url=thumb_url,
                tg_file_id=None,
            )
            stmt = stmt.on_conflict_do_update(
                index_elements=[BotMedia.key],
                set_={
                    "file_url": file_url,
                    "thumb_url": thumb_url,
                    "tg_file_id": None,
                    "updated_at": func.now(),
                },
            )
            await self.session.execute(stmt)
        else:
            existing = await self.get_by_key(key)
            if existing:
                existing.file_url = file_url
                existing.thumb_url = thumb_url
                existing.tg_file_id = None
            else:
                self.session.add(BotMedia(
                    key=key,
                    file_url=file_url,
                    thumb_url=thumb_url,
                    tg_file_id=None,
                ))
        await self.session.flush()
        return await self.get_by_key(key)  # type: ignore[return-value]

    async def set_tg_file_id(self, key: str, tg_file_id: Optional[str]) -> None:
        """Сохранить (или сбросить через None) Telegram file_id.

        Идемпотентно: если слота нет, ничего не меняем.
        Не трогает `updated_at` чтобы UI админки не показывал «обновлено»
        каждый раз когда бот закэшировал file_id.
        """
        stmt = (
            update(BotMedia)
            .where(BotMedia.key == key)
            .values(tg_file_id=tg_file_id)
        )
        await self.session.execute(stmt)

    async def delete_by_key(self, key: str) -> bool:
        stmt = delete(BotMedia).where(BotMedia.key == key)
        result = await self.session.execute(stmt)
        return result.rowcount > 0
