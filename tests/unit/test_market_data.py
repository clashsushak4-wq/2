"""
Unit-тесты для `backend.core.market_data`:
  * `fetch_binance_ohlcv` парсер — проверяет форму ответа на мок-данных.

Мы не ходим в реальный Binance — везде мокируем `aiohttp`.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from backend.core import market_data as md
from backend.core.market_data import (
    MarketDataError,
    binance_timeframe,
    normalize_binance_symbol,
)


# ── normalize / timeframe helpers ─────────────────────────────

def test_normalize_binance_symbol():
    assert normalize_binance_symbol("btc/usdt") == "BTCUSDT"
    assert normalize_binance_symbol("eth-usdt") == "ETHUSDT"
    assert normalize_binance_symbol("SOLUSDT") == "SOLUSDT"


def test_binance_timeframe_ok():
    assert binance_timeframe("5m") == "5m"
    assert binance_timeframe("1h") == "1h"


def test_binance_timeframe_invalid():
    with pytest.raises(MarketDataError, match="Invalid timeframe"):
        binance_timeframe("42s")


# ── Binance fetchers: мокаем aiohttp.ClientSession ────────────

def _fake_aiohttp_session(response_json, status: int = 200):
    """Возвращает объект-заглушку, имитирующий `async with aiohttp.ClientSession() as s`."""
    resp = MagicMock()
    resp.status = status
    resp.json = AsyncMock(return_value=response_json)
    resp.text = AsyncMock(return_value=str(response_json))

    class _FakeReqCtx:
        async def __aenter__(self):
            return resp

        async def __aexit__(self, *a):
            return None

    class _FakeSession:
        def get(self, url, params=None, headers=None):
            return _FakeReqCtx()

        async def __aenter__(self):
            return self

        async def __aexit__(self, *a):
            return None

    return _FakeSession()


@pytest.mark.asyncio
async def test_fetch_binance_ohlcv_parses_klines():
    raw = [
        [1_700_000_000_000, "42000", "42100", "41950", "42050", "1.5",
         1_700_000_059_999, "63075", 5, "0.8", "33630", "0"],
        [1_700_000_060_000, "42050", "42080", "42000", "42030", "0.9",
         1_700_000_119_999, "37827", 3, "0.5", "21015", "0"],
    ]
    fake = _fake_aiohttp_session(raw)
    with patch("backend.core.market_data.aiohttp.ClientSession", return_value=fake):
        candles = await md.fetch_binance_ohlcv("BTCUSDT", "1m", limit=2)

    assert len(candles) == 2
    assert candles[0] == {
        "time": 1_700_000_000,
        "open": 42000.0,
        "high": 42100.0,
        "low": 41950.0,
        "close": 42050.0,
        "volume": 1.5,
    }


@pytest.mark.asyncio
async def test_fetch_binance_ohlcv_raises_on_error_status():
    fake = _fake_aiohttp_session({"code": -1}, status=500)
    with patch("backend.core.market_data.aiohttp.ClientSession", return_value=fake):
        with pytest.raises(MarketDataError, match="HTTP 500"):
            await md.fetch_binance_ohlcv("BTCUSDT", "1m")


@pytest.mark.asyncio
async def test_fetch_binance_ohlcv_rejects_invalid_timeframe():
    with pytest.raises(MarketDataError, match="Invalid timeframe"):
        await md.fetch_binance_ohlcv("BTCUSDT", "42s")
