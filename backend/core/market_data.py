"""Market-data helpers для backend routes (`charts`).

Что здесь:
  * Fetchers для Binance Futures (public): `fetch_binance_ohlcv`,
    `fetch_binance_symbols`.

Все fetchers возвращают единообразные Python-структуры и бросают
`MarketDataError` на HTTP-ошибках провайдера. Роуты уже переводят их в
`HTTPException(502, ...)`.
"""
from __future__ import annotations

import logging
from typing import Any

import aiohttp

logger = logging.getLogger(__name__)


# ── Errors ───────────────────────────────────────────────────

class MarketDataError(RuntimeError):
    """HTTP/API error bubbled up from Binance."""


# ── Binance Futures public API ──────────────────────────────

BINANCE_API = "https://fapi.binance.com"

_BINANCE_TF = {
    "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m",
    "1h": "1h", "4h": "4h", "1d": "1d", "1w": "1w",
}


def normalize_binance_symbol(symbol: str) -> str:
    """`btc/usdt` → `BTCUSDT`."""
    return symbol.replace("/", "").replace("-", "").upper()


def binance_timeframe(tf: str) -> str:
    """Валидирует и возвращает TF, иначе бросает `MarketDataError`."""
    resolved = _BINANCE_TF.get(tf)
    if resolved is None:
        raise MarketDataError(
            f"Invalid timeframe '{tf}'. Use: {list(_BINANCE_TF.keys())}"
        )
    return resolved


async def _binance_get(session: aiohttp.ClientSession, path: str, params: dict) -> Any:
    url = f"{BINANCE_API}{path}"
    async with session.get(url, params=params) as resp:
        text = await resp.text()
        if resp.status != 200:
            raise MarketDataError(f"Binance {path} HTTP {resp.status}: {text}")
        try:
            return await resp.json(content_type=None)
        except Exception:
            # На случай, если Binance вдруг вернёт не-JSON (rate-limit page, etc.)
            raise MarketDataError(f"Binance {path}: invalid JSON: {text[:200]}")


async def fetch_binance_symbols(
    market_type: str = "futures",
    quote: str = "USDT",
    limit: int = 200,
) -> list[dict]:
    """Список торгуемых пар с Binance, отсортированных по 24h quote-volume.

    Возвращает: [{ symbol, base, quote, volume_24h, price, change_24h }]
    Только pairs со статусом TRADING и нужным quote (по умолч. USDT).
    """
    if market_type == "spot":
        info_url = "https://api.binance.com/api/v3/exchangeInfo"
        ticker_url = "https://api.binance.com/api/v3/ticker/24hr"
    else:
        info_url = "https://fapi.binance.com/fapi/v1/exchangeInfo"
        ticker_url = "https://fapi.binance.com/fapi/v1/ticker/24hr"

    timeout = aiohttp.ClientTimeout(total=10)
    async with aiohttp.ClientSession(timeout=timeout) as s:
        # Параллельно: список пар + 24h тикеры (массивом без symbol)
        async with s.get(info_url) as r1, s.get(ticker_url) as r2:
            if r1.status != 200 or r2.status != 200:
                raise MarketDataError(
                    f"Binance symbols fetch failed: info={r1.status}, ticker={r2.status}"
                )
            info = await r1.json(content_type=None)
            tickers = await r2.json(content_type=None)

    # Маппинг symbol → ticker
    by_sym: dict[str, dict] = {}
    for t in tickers:
        sym = t.get("symbol")
        if sym:
            by_sym[sym] = t

    # Фильтруем pairs: только TRADING и нужный quote
    quote_upper = quote.upper()
    rows: list[dict] = []
    for s_info in info.get("symbols", []):
        if s_info.get("status") != "TRADING":
            continue
        if s_info.get("quoteAsset") != quote_upper:
            continue
        if market_type == "futures" and s_info.get("contractType") != "PERPETUAL":
            continue

        sym = s_info.get("symbol")
        t = by_sym.get(sym)
        if not t:
            continue

        try:
            volume = float(t.get("quoteVolume", 0))
            price = float(t.get("lastPrice", 0))
            change = float(t.get("priceChangePercent", 0))
        except (ValueError, TypeError):
            continue

        if volume <= 0 or price <= 0:
            continue

        rows.append({
            "symbol": sym,
            "base": s_info.get("baseAsset", ""),
            "quote": s_info.get("quoteAsset", ""),
            "volume_24h": volume,
            "price": price,
            "change_24h": change,
        })

    rows.sort(key=lambda r: r["volume_24h"], reverse=True)
    return rows[:max(1, min(limit, 500))]


async def fetch_binance_ohlcv(
    symbol: str, timeframe: str, limit: int = 500, since: int | None = None,
    end_time: int | None = None, api_key: str | None = None,
) -> list[dict]:
    """OHLCV c Binance Futures. `since`/`end_time` — unix millis."""
    sym = normalize_binance_symbol(symbol)
    interval = binance_timeframe(timeframe)
    limit = max(1, min(limit, 1500))

    params: dict[str, Any] = {"symbol": sym, "interval": interval, "limit": limit}
    if since is not None:
        params["startTime"] = int(since)
    if end_time is not None:
        params["endTime"] = int(end_time)

    headers: dict[str, str] = {}
    if api_key:
        headers["X-MBX-APIKEY"] = api_key

    async with aiohttp.ClientSession(headers=headers) as s:
        raw = await _binance_get(s, "/fapi/v1/klines", params)

    return [
        {
            "time": int(c[0] / 1000),
            "open": float(c[1]),
            "high": float(c[2]),
            "low": float(c[3]),
            "close": float(c[4]),
            "volume": float(c[5]),
        }
        for c in raw
    ]
