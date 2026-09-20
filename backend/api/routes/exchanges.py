"""Admin exchange management — CRUD for exchange API keys."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.api.schemas import SuccessResponse
from backend.api.schemas.exchanges import ExchangeCreate, ExchangeResponse, ExchangeUpdate
from backend.core.deps import get_session, get_admin_user_id
from shared.database.repo.exchanges import ExchangeRepo
from shared.market_settings import MarketSettings

router = APIRouter()


def _mask(key: str) -> str:
    if not key:
        return "публичный"
    if len(key) <= 8:
        return "••••••"
    return key[:4] + "••••" + key[-4:]


def _to_response(ex, repo: ExchangeRepo) -> ExchangeResponse:
    from backend.services.exchange_manager import exchange_manager
    api_key, _ = repo.decrypt_key(ex)
    return ExchangeResponse(
        id=ex.id,
        name=ex.name,
        api_key_masked=_mask(api_key),
        is_active=ex.is_active,
        created_at=ex.created_at,
        market_settings=MarketSettings.model_validate(ex.market_settings or {}),
        supported=ex.name.lower() == "bybit",
        health=exchange_manager.health_for(ex.id),
    )


@router.get("/", response_model=list[ExchangeResponse])
async def list_exchanges(
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = ExchangeRepo(session)
    exchanges = await repo.get_all()
    return [_to_response(ex, repo) for ex in exchanges]


@router.post("/", response_model=ExchangeResponse)
async def add_exchange(
    data: ExchangeCreate,
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = ExchangeRepo(session)
    ex = await repo.create(name=data.name, api_key=data.api_key, api_secret=data.api_secret,
                           market_settings=data.market_settings.model_dump())
    return _to_response(ex, repo)


@router.patch("/{exchange_id}", response_model=ExchangeResponse)
async def edit_exchange(exchange_id: int, data: ExchangeUpdate,
                        session: AsyncSession = Depends(get_session),
                        _admin_id: int = Depends(get_admin_user_id)):
    repo = ExchangeRepo(session)
    ex = await repo.get(exchange_id)
    if ex is None:
        raise HTTPException(404, "Exchange not found")
    if ex.name.lower() != "bybit" and data.is_active:
        raise HTTPException(400, "This provider is not supported by the terminal")
    ex = await repo.edit(ex, data.model_dump(exclude_unset=True))
    return _to_response(ex, repo)


@router.post("/{exchange_id}/check")
async def check_exchange(exchange_id: int, session: AsyncSession = Depends(get_session),
                         _admin_id: int = Depends(get_admin_user_id)):
    import aiohttp
    from backend.services.bybit_market import BybitMarket, MarketError

    repo = ExchangeRepo(session)
    ex = await repo.get(exchange_id)
    if ex is None:
        raise HTTPException(404, "Exchange not found")
    if ex.name.lower() != "bybit":
        raise HTTPException(400, "Unsupported provider")
    key, secret = repo.decrypt_key(ex)
    async with aiohttp.ClientSession() as client:
        adapter = BybitMarket(client, MarketSettings.model_validate(ex.market_settings or {}), key, secret)
        try:
            instruments = await adapter.instruments()
        except MarketError as error:
            return {"public": False, "credentials": False, "error": str(error)}
        try:
            await adapter.get("/v5/account/fee-rate", {"category": "linear"}, signed=True)
            return {"public": True, "credentials": True, "instrumentCount": len(instruments), "error": None}
        except MarketError as error:
            return {"public": True, "credentials": False, "instrumentCount": len(instruments), "error": str(error)}


@router.delete("/{exchange_id}", response_model=SuccessResponse)
async def delete_exchange(
    exchange_id: int,
    session: AsyncSession = Depends(get_session),
    _admin_id: int = Depends(get_admin_user_id),
):
    repo = ExchangeRepo(session)
    deleted = await repo.delete_exchange(exchange_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Exchange not found")
    return SuccessResponse()
