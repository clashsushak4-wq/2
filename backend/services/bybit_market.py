"""Read-only Bybit market adapter and snapshot/delta normalization."""

import asyncio
import hashlib
import hmac
import math
import time
from decimal import Decimal
from urllib.parse import urlencode

import aiohttp

from shared.market_settings import MarketSettings

INTERVALS = {
    "1m": "1", "3m": "3", "5m": "5", "15m": "15", "30m": "30",
    "1h": "60", "2h": "120", "4h": "240", "6h": "360", "12h": "720",
    "1d": "D", "1w": "W", "1M": "M",
}
TICKER_FIELDS = {
    "lastPrice": "price", "markPrice": "markPrice", "indexPrice": "indexPrice",
    "price24hPcnt": "changePercent", "highPrice24h": "high24h", "lowPrice24h": "low24h",
    "volume24h": "volume24h", "turnover24h": "turnover24h", "openInterest": "openInterest",
    "fundingRate": "fundingRate", "nextFundingTime": "nextFundingTime",
    "bid1Price": "bidPrice", "ask1Price": "askPrice",
}


class MarketError(Exception):
    pass


def timestamp() -> int:
    return int(time.time() * 1000)


def number(value, *, positive=False):
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(result) or (positive and result <= 0):
        return None
    return result


def normalize_instrument(item: dict, settings: MarketSettings) -> dict | None:
    if (item.get("status") != "Trading" or item.get("quoteCoin") != settings.quote
            or item.get("settleCoin") != settings.quote or item.get("contractType") != settings.contract_type):
        return None
    lot, price, leverage = item["lotSizeFilter"], item["priceFilter"], item["leverageFilter"]
    tick = number(price["tickSize"], positive=True)
    step = number(lot["qtyStep"], positive=True)
    if tick is None or step is None:
        raise MarketError("invalid_instrument_steps")
    return {
        "symbol": item["symbol"], "baseAsset": item["baseCoin"], "quoteAsset": item["quoteCoin"],
        "marginAsset": item["settleCoin"], "contractType": item["contractType"],
        "priceDecimals": max(0, -Decimal(price["tickSize"]).normalize().as_tuple().exponent),
        "tickSize": tick, "quantityStep": step,
        "minQuantity": number(lot["minOrderQty"], positive=True),
        "minNotional": number(lot.get("minNotionalValue"), positive=True),
        "maxQuantity": number(lot.get("maxOrderQty"), positive=True),
        "maxMarketQuantity": number(lot.get("maxMktOrderQty"), positive=True),
        "maxLeverage": number(leverage["maxLeverage"], positive=True),
        "leverageStep": number(leverage["leverageStep"], positive=True),
        "launchTime": int(item.get("launchTime") or 0),
        "isNew": timestamp() - int(item.get("launchTime") or 0) < 30 * 86400_000,
        "makerFeeRate": None, "takerFeeRate": None, "riskTiers": [],
        "buyLimit": None, "sellLimit": None, "rulesUpdatedAt": None,
        "tradingReady": False, "rulesError": None,
        **{field: None for field in TICKER_FIELDS.values()},
        "updatedAt": None, "receivedAt": None,
    }


def merge_ticker(instrument: dict, data: dict, event_time: int) -> dict:
    if instrument.get("updatedAt") and event_time < instrument["updatedAt"]:
        return instrument
    result = {**instrument}
    for incoming, field in TICKER_FIELDS.items():
        if incoming not in data:
            continue
        value = number(data[incoming])
        if value is None:
            continue
        if field in {"price", "markPrice", "indexPrice", "bidPrice", "askPrice"} and value <= 0:
            continue
        if field == "changePercent":
            value *= 100
        result[field] = value
    result.update(updatedAt=event_time, receivedAt=timestamp())
    return result


def merge_orderbook(previous: dict | None, message: dict) -> dict:
    data = message["data"]
    reset = message.get("type") == "snapshot" or data.get("u") == 1
    if previous is None and not reset:
        raise MarketError("orderbook_snapshot_required")
    if previous and not reset and data.get("u", 0) <= previous["updateId"]:
        return previous
    sides = {}
    for key, target in (("b", "bids"), ("a", "asks")):
        levels = {} if reset else {str(price): size for price, size in previous[target]}
        for price, size in data.get(key, []):
            parsed_price, parsed_size = number(price, positive=True), number(size)
            if parsed_price is None or parsed_size is None or parsed_size < 0:
                raise MarketError("invalid_orderbook_level")
            normalized_price = str(parsed_price)
            if parsed_size == 0:
                levels.pop(normalized_price, None)
            else:
                levels[normalized_price] = parsed_size
        sides[target] = sorted([[float(price), size] for price, size in levels.items()], reverse=target == "bids")
    return {**sides, "symbol": data["s"], "updateId": data["u"], "sequence": data.get("seq"),
            "updatedAt": message["ts"], "receivedAt": timestamp()}


class BybitMarket:
    def __init__(self, session: aiohttp.ClientSession, settings: MarketSettings, api_key="", api_secret=""):
        self.session, self.settings = session, settings
        self.api_key, self.api_secret = api_key, api_secret
        testnet = settings.environment == "testnet"
        self.rest_url = "https://api-testnet.bybit.com" if testnet else "https://api.bybit.com"
        self.ws_url = ("wss://stream-testnet.bybit.com" if testnet else "wss://stream.bybit.com") + "/v5/public/linear"

    async def get(self, path: str, params: dict | None = None, *, signed=False) -> dict:
        query = urlencode(sorted((params or {}).items()))
        if signed and not (self.api_key and self.api_secret):
            raise MarketError("credentials_required_for_fees")
        for attempt in range(3):
            headers = {}
            if signed:
                now, window = str(timestamp()), "5000"
                signature = hmac.new(self.api_secret.encode(), (now + self.api_key + window + query).encode(), hashlib.sha256).hexdigest()
                headers = {"X-BAPI-API-KEY": self.api_key, "X-BAPI-SIGN": signature,
                           "X-BAPI-TIMESTAMP": now, "X-BAPI-RECV-WINDOW": window}
            try:
                async with self.session.get(f"{self.rest_url}{path}?{query}", headers=headers,
                                            timeout=aiohttp.ClientTimeout(total=12)) as response:
                    if response.status == 429 or response.status >= 500:
                        raise aiohttp.ClientConnectionError("provider_temporarily_unavailable")
                    if response.status != 200:
                        raise MarketError(f"provider_http_{response.status}")
                    data = await response.json()
                if data.get("retCode") == 10006:
                    raise aiohttp.ClientConnectionError("provider_rate_limit")
                if data.get("retCode") != 0:
                    raise MarketError(f"provider_code_{data.get('retCode', 'invalid_response')}")
                return data
            except (aiohttp.ClientError, asyncio.TimeoutError):
                if attempt == 2:
                    raise MarketError("provider_unavailable") from None
                await asyncio.sleep(0.5 * 2 ** attempt)
        raise MarketError("provider_unavailable")

    async def instruments(self) -> dict[str, dict]:
        result, cursor, seen = {}, "", set()
        while True:
            data = await self.get("/v5/market/instruments-info", {"category": "linear", "limit": 1000, **({"cursor": cursor} if cursor else {})})
            for item in data["result"]["list"]:
                instrument = normalize_instrument(item, self.settings)
                if instrument:
                    result[item["symbol"]] = instrument
            cursor = data["result"].get("nextPageCursor", "")
            if not cursor:
                return result
            if cursor in seen:
                raise MarketError("repeated_catalog_cursor")
            seen.add(cursor)

    async def rules(self, symbol: str) -> dict:
        fees, risks, limits = await asyncio.gather(
            self.get("/v5/account/fee-rate", {"category": "linear", "symbol": symbol}, signed=True),
            self.get("/v5/market/risk-limit", {"category": "linear", "symbol": symbol}),
            self.get("/v5/market/price-limit", {"category": "linear", "symbol": symbol}),
        )
        fee = next((row for row in fees["result"]["list"] if row.get("symbol") in (symbol, "")), None)
        tiers = sorted(risks["result"]["list"], key=lambda row: float(row["riskLimitValue"]))
        if fee is None or not tiers:
            raise MarketError("trading_rules_unavailable")
        rate, deduction, previous_limit, previous_rate = [], Decimal(0), Decimal(0), Decimal(0)
        for tier in tiers:
            current_rate = Decimal(str(tier["maintenanceMargin"]))
            deduction += previous_limit * (current_rate - previous_rate)
            actual_deduction = Decimal(str(tier.get("mmDeduction") or deduction))
            rate.append({"limit": float(tier["riskLimitValue"]), "maintenanceMarginRate": float(current_rate),
                         "maintenanceMarginDeduction": float(actual_deduction), "maxLeverage": float(tier["maxLeverage"])})
            previous_limit, previous_rate = Decimal(str(tier["riskLimitValue"])), current_rate
        maker, taker = number(fee["makerFeeRate"]), number(fee["takerFeeRate"])
        buy, sell = number(limits["result"].get("buyLmt"), positive=True), number(limits["result"].get("sellLmt"), positive=True)
        if maker is None or taker is None or buy is None or sell is None:
            raise MarketError("invalid_trading_rules")
        return {"makerFeeRate": maker, "takerFeeRate": taker, "riskTiers": rate,
                "buyLimit": buy, "sellLimit": sell, "rulesUpdatedAt": timestamp(),
                "tradingReady": True, "rulesError": None}

    async def candles(self, symbol: str, timeframe: str, end: int | None = None, limit=500) -> list[dict]:
        if timeframe not in INTERVALS:
            raise MarketError("unsupported_timeframe")
        params = {"category": "linear", "symbol": symbol, "interval": INTERVALS[timeframe], "limit": min(1000, max(1, limit))}
        if end is not None:
            params["end"] = end
        data = await self.get("/v5/market/kline", params)
        candles = {int(row[0]) // 1000: {"time": int(row[0]) // 1000, "open": float(row[1]),
                    "high": float(row[2]), "low": float(row[3]), "close": float(row[4]),
                    "volume": float(row[5])} for row in data["result"]["list"]}
        return [candles[key] for key in sorted(candles)]

    async def recent_trades(self, symbol: str) -> list[dict]:
        data = await self.get("/v5/market/recent-trade", {"category": "linear", "symbol": symbol, "limit": 100})
        return [{"id": row["execId"], "symbol": row["symbol"], "price": float(row["price"]),
                 "amount": float(row["size"]), "time": int(row["time"]),
                 "direction": row["side"].lower()} for row in data["result"]["list"]]
