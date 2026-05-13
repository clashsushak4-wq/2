"""Charts API — OHLCV data for crypto exchanges configured via admin panel.

Эндпоинты требуют Telegram WebApp initData.
Криптобиржа определяется по записям в таблице `exchanges` (ключи вводятся
через админку). Если нет активной биржи — 404.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.deps import get_current_user_id, get_session
from backend.core.market_data import (
    MarketDataError,
    fetch_binance_ohlcv,
    fetch_binance_symbols,
)
from shared.database.repo.exchanges import ExchangeRepo

router = APIRouter()


@router.get("/crypto/ohlcv/{symbol:path}")
async def crypto_ohlcv(
    symbol: str,
    timeframe: str = "1h",
    limit: int = 1500,
    since: int | None = None,
    end_time: int | None = None,
    _user_id: int = Depends(get_current_user_id),
    session: AsyncSession = Depends(get_session),
):
    """Fetch OHLCV using exchange API keys from admin panel."""
    repo = ExchangeRepo(session)
    exchanges = await repo.get_active()

    if not exchanges:
        raise HTTPException(status_code=404, detail="No exchange configured. Add API keys in admin panel.")

    exchange = exchanges[0]
    api_key, _ = repo.decrypt_key(exchange)
    name = exchange.name.lower()

    try:
        if name in ("binance", "binance futures"):
            candles = await fetch_binance_ohlcv(
                symbol, timeframe, limit=limit, since=since,
                end_time=end_time, api_key=api_key if api_key else None,
            )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Exchange '{exchange.name}' is not supported for crypto charts yet.",
            )
    except MarketDataError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {
        "symbol": symbol.upper(),
        "timeframe": timeframe,
        "candles": candles,
        "exchange": name,
    }


@router.get("/crypto/symbols")
async def crypto_symbols(
    market: str = "futures",
    quote: str = "USDT",
    limit: int = 200,
    _user_id: int = Depends(get_current_user_id),
):
    """Список доступных торговых пар с Binance отсортированный по объёму.

    Параметры:
        market — 'spot' или 'futures'
        quote  — котируемая валюта (USDT по умолчанию)
        limit  — макс. количество пар (default 200, max 500)
    """
    if market not in ("spot", "futures"):
        raise HTTPException(status_code=400, detail="market must be 'spot' or 'futures'")

    try:
        rows = await fetch_binance_symbols(market_type=market, quote=quote, limit=limit)
    except MarketDataError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return rows


