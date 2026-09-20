# database/repo/exchanges.py

from sqlalchemy import select, delete, update
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

    async def create(self, name: str, api_key: str, api_secret: str, market_settings: dict | None = None) -> Exchange:
        exchange = Exchange(
            name=name,
            api_key_enc=crypto.encrypt(api_key),
            api_secret_enc=crypto.encrypt(api_secret),
            is_active=False,
            market_settings=market_settings,
        )
        self.session.add(exchange)
        await self.session.flush()
        await self.session.refresh(exchange)
        return exchange

    async def get(self, exchange_id: int) -> Exchange | None:
        return await self.session.get(Exchange, exchange_id)

    async def edit(self, exchange: Exchange, values: dict) -> Exchange:
        if values.get("is_active") is True:
            await self.session.execute(select(Exchange.id).order_by(Exchange.id).with_for_update())
            await self.session.execute(update(Exchange).where(Exchange.id != exchange.id).values(is_active=False))
        for key in ("is_active", "market_settings"):
            if key in values and values[key] is not None:
                setattr(exchange, key, values[key])
        if values.get("api_key") is not None:
            exchange.api_key_enc = crypto.encrypt(values["api_key"])
            exchange.api_secret_enc = crypto.encrypt(values["api_secret"])
        await self.session.flush()
        await self.session.refresh(exchange)
        return exchange

    async def delete_exchange(self, exchange_id: int) -> bool:
        result = await self.session.execute(
            delete(Exchange).where(Exchange.id == exchange_id)
        )
        return result.rowcount > 0

    def decrypt_key(self, exchange: Exchange) -> tuple[str, str]:
        return crypto.decrypt(exchange.api_key_enc), crypto.decrypt(exchange.api_secret_enc)
