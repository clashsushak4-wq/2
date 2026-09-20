"""Compatibility chart endpoints use the same admin-selected market source."""

from fastapi import APIRouter, Depends

from backend.api.routes.market import candles, check_source
from backend.core.deps import get_current_user_id
from backend.services.exchange_manager import exchange_manager

router = APIRouter()


@router.get("/crypto/ohlcv/{symbol:path}")
async def crypto_ohlcv(symbol: str, timeframe: str = "1h", limit: int = 500,
                       end_time: int | None = None, _user_id: int = Depends(get_current_user_id)):
    result = await candles(symbol.upper().replace("/", ""), timeframe, None, end_time, min(1000, max(1, limit)))
    return {**result, "exchange": exchange_manager.source["name"]}


@router.get("/crypto/symbols")
async def crypto_symbols(_user_id: int = Depends(get_current_user_id)):
    check_source()
    return list(exchange_manager.instruments_cache.values())
