# database/repo/exchanges.py

from sqlalchemy import select, delete
from shared.database.models.exchanges import Exchange
from shared.database.repo.base import BaseRepo
from shared.services.cryptography import crypto


class ExchangeRepo(BaseRepo):

    async def get_all(self) -> list[Exchange]:
        result = await self.session.execute(
            select(Exchange).order_by(Exchange.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_active(self) -> list[Exchange]:
        result = await self.session.execute(
            select(Exchange).where(Exchange.is_active == True).order_by(Exchange.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_by_name(self, name: str) -> Exchange | None:
        result = await self.session.execute(
            select(Exchange).where(Exchange.name == name, Exchange.is_active == True)
        )
        return result.scalar_one_or_none()

    async def create(self, name: str, api_key: str, api_secret: str) -> Exchange:
        exchange = Exchange(
            name=name,
            api_key_enc=crypto.encrypt(api_key),
            api_secret_enc=crypto.encrypt(api_secret),
        )
        self.session.add(exchange)
        await self.session.commit()
        await self.session.refresh(exchange)
        return exchange

    async def delete_exchange(self, exchange_id: int) -> bool:
        result = await self.session.execute(
            delete(Exchange).where(Exchange.id == exchange_id)
        )
        await self.session.commit()
        return result.rowcount > 0

    def decrypt_key(self, exchange: Exchange) -> tuple[str, str]:
        return crypto.decrypt(exchange.api_key_enc), crypto.decrypt(exchange.api_secret_enc)
