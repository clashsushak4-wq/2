"""Market data always belongs to the source selected in the admin app."""

import json

from fastapi import APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect

from backend.core.websocket_manager import ws_manager
from backend.services.bybit_market import INTERVALS, MarketError
from backend.services.exchange_manager import exchange_manager

router = APIRouter()
ws_router = APIRouter()


def check_source(version=None, symbol=None):
    try:
        source = exchange_manager.require_source()
    except MarketError as error:
        raise HTTPException(503, str(error)) from None
    if version and version != exchange_manager.version:
        raise HTTPException(409, "source_changed")
    if symbol and symbol not in exchange_manager.instruments_cache:
        raise HTTPException(404, "unknown_instrument")
    return source


@router.get("/snapshot")
async def snapshot():
    return exchange_manager.snapshot()


@router.get("/candles/{symbol}")
async def candles(symbol: str, timeframe: str = "1m", version: str | None = None,
                  end: int | None = None, limit: int = Query(500, ge=1, le=1000)):
    check_source(version, symbol)
    active_version = exchange_manager.version
    try:
        rows = await exchange_manager.adapter.candles(symbol, timeframe, end, limit)
    except MarketError as error:
        raise HTTPException(502, str(error)) from None
    check_source(active_version, symbol)
    return {"version": active_version, "symbol": symbol, "timeframe": timeframe, "candles": rows}


@router.get("/trades/{symbol}")
async def trades(symbol: str, version: str | None = None):
    check_source(version, symbol)
    active_version = exchange_manager.version
    try:
        rows = await exchange_manager.adapter.recent_trades(symbol)
    except MarketError as error:
        raise HTTPException(502, str(error)) from None
    check_source(active_version, symbol)
    return {"version": active_version, "symbol": symbol, "trades": rows}


@router.get("/rules/{symbol}")
async def rules(symbol: str, version: str | None = None):
    check_source(version, symbol)
    active_version = exchange_manager.version
    instrument = await exchange_manager.ensure_rules(symbol)
    check_source(active_version, symbol)
    return {"version": active_version, "instrument": instrument}


@ws_router.websocket("")
async def market_data_websocket(websocket: WebSocket):
    await ws_manager.connect(websocket, exchange_manager.snapshot())
    try:
        while True:
            text = await websocket.receive_text()
            if len(text) > 2048:
                await websocket.close(code=1009)
                break
            try:
                request = json.loads(text)
            except ValueError:
                continue
            if not isinstance(request, dict):
                continue
            if request.get("type") == "ping":
                ws_manager.send(websocket, exchange_manager.envelope("pong"))
            elif request.get("type") == "unsubscribe":
                ws_manager.subscriptions.pop(websocket, None)
            elif request.get("type") == "subscribe":
                symbol, timeframe = request.get("symbol"), request.get("timeframe", "1m")
                if symbol not in exchange_manager.instruments_cache or timeframe not in INTERVALS:
                    ws_manager.send(websocket, exchange_manager.envelope("error", error="invalid_subscription"))
                    continue
                ws_manager.subscriptions[websocket] = (symbol, timeframe)
                if symbol in exchange_manager.books:
                    ws_manager.send(websocket, exchange_manager.envelope("orderbook", symbol=symbol, book=exchange_manager.books[symbol]))
                if symbol in exchange_manager.trades:
                    ws_manager.send(websocket, exchange_manager.envelope("trades", symbol=symbol, trades=exchange_manager.trades[symbol]))
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(websocket)
