"""The admin-selected source owns every market snapshot and subscription."""

import asyncio
import hashlib
import json
import time
from contextlib import suppress
from uuid import uuid4

import aiohttp
from loguru import logger

from backend.core.websocket_manager import ws_manager
from backend.services.bybit_market import (
    BybitMarket, INTERVALS, MarketError, merge_orderbook, merge_ticker, timestamp,
)
from shared.database.core import session_maker
from shared.database.repo.exchanges import ExchangeRepo
from shared.market_settings import MarketSettings, source_key


class ExchangeManager:
    def __init__(self):
        self.session = None
        self.tasks = []
        self.feed = None
        self.adapter = None
        self.source = None
        self.version = uuid4().hex
        self.sequence = 0
        self.execution_sequence = 0
        self.status = "unconfigured"
        self.error = None
        self.last_message = 0
        self.instruments_cache = {}
        self.books = {}
        self.trades = {}
        self.dirty = set()
        self.rules_tasks = {}
        self.rules_retry = {}
        self.demo_symbols = set()
        self.events = asyncio.Queue(maxsize=10000)
        self._fingerprint = None

    async def start(self):
        if self.session:
            return
        self.session = aiohttp.ClientSession()
        self.tasks = [asyncio.create_task(self._control()), asyncio.create_task(self._publish_loop()),
                      asyncio.create_task(self._rules_loop())]

    async def stop(self):
        for task in self.tasks:
            task.cancel()
        await asyncio.gather(*self.tasks, return_exceptions=True)
        await self._stop_feed()
        await ws_manager.stop()
        if self.session:
            await self.session.close()
        self.session = None

    async def _stop_feed(self):
        tasks = list(self.rules_tasks.values()) + ([self.feed] if self.feed else [])
        for task in tasks:
            task.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        self.feed = None
        self.rules_tasks.clear()

    def health_for(self, exchange_id):
        if not self.source or self.source["id"] != exchange_id:
            return {"status": "inactive", "error": None, "lastMessageAt": None}
        return {"status": self.effective_status(), "error": self.error,
                "lastMessageAt": self.last_message or None, "instrumentCount": len(self.instruments_cache)}

    def effective_status(self):
        if self.status == "live" and timestamp() - self.last_message > 15000:
            return "stale"
        return self.status

    def envelope(self, kind, **values):
        return {"type": kind, "version": self.version, "sequence": self.sequence,
                "source": self.source, "status": self.effective_status(), "error": self.error,
                "serverTime": timestamp(), "lastMessageAt": self.last_message or None, **values}

    def snapshot(self):
        return self.envelope("snapshot", instruments=list(self.instruments_cache.values()),
                             timeframes=list(INTERVALS))

    def emit(self, kind, **values):
        self.sequence += 1
        message = self.envelope(kind, **values)
        ws_manager.publish(message)
        return message

    async def _control(self):
        while True:
            try:
                async with session_maker() as session:
                    repo = ExchangeRepo(session)
                    exchanges = await repo.get_active()
                    fingerprint = hashlib.sha256(json.dumps([
                        [ex.id, ex.name, ex.api_key_enc, ex.api_secret_enc, ex.market_settings]
                        for ex in exchanges
                    ], sort_keys=True).encode()).hexdigest()
                    if fingerprint != self._fingerprint:
                        await self._stop_feed()
                        self._fingerprint = fingerprint
                        self.version = uuid4().hex
                        self.instruments_cache, self.books, self.trades = {}, {}, {}
                        self.dirty.clear()
                        self.rules_retry.clear()
                        self.demo_symbols.clear()
                        while not self.events.empty():
                            self.events.get_nowait()
                        self.source, self.adapter = None, None
                        self.last_message = 0
                        self.status, self.error = "unconfigured", None
                        if len(exchanges) > 1:
                            self.status, self.error = "error", "select_one_source_in_admin"
                        elif exchanges:
                            exchange = exchanges[0]
                            if exchange.name.lower() != "bybit":
                                self.status, self.error = "error", "unsupported_provider"
                            else:
                                settings = MarketSettings.model_validate(exchange.market_settings or {})
                                key, secret = repo.decrypt_key(exchange)
                                self.source = {"id": exchange.id, "name": exchange.name,
                                    "key": source_key(exchange.id, settings), "environment": settings.environment,
                                    "category": settings.category, "quote": settings.quote,
                                    "initialBalance": settings.initial_balance, "execution": "server_demo"}
                                self.adapter = BybitMarket(self.session, settings, key, secret)
                                self.status = "connecting"
                                self.feed = asyncio.create_task(self._run_source())
                        self.emit("snapshot", instruments=[], timeframes=list(INTERVALS))
            except asyncio.CancelledError:
                raise
            except Exception as error:
                self.status, self.error = "error", "configuration_unavailable"
                logger.warning("Market configuration unavailable: {}", type(error).__name__)
            await asyncio.sleep(3)

    async def _publish_loop(self):
        next_status = 0
        while True:
            if self.dirty:
                symbols, self.dirty = self.dirty, set()
                self.emit("update", instruments=[self.instruments_cache[s] for s in symbols if s in self.instruments_cache])
            if time.monotonic() >= next_status:
                self.emit("status")
                next_status = time.monotonic() + 2
            await asyncio.sleep(0.2)

    def needed_symbols(self):
        return self.demo_symbols | {symbol for symbol, _ in ws_manager.subscriptions.values()}

    async def ensure_rules(self, symbol):
        if symbol not in self.instruments_cache or not self.adapter:
            raise MarketError("unknown_instrument")
        instrument = self.instruments_cache[symbol]
        if instrument.get("rulesUpdatedAt") and timestamp() - instrument["rulesUpdatedAt"] < 30000:
            return instrument
        task = self.rules_tasks.get(symbol)
        if task:
            await asyncio.shield(task)
            return self.instruments_cache.get(symbol)
        if time.monotonic() < self.rules_retry.get(symbol, 0):
            return instrument
        adapter, version = self.adapter, self.version

        async def load():
            try:
                rules = await adapter.rules(symbol)
                if self.version == version and symbol in self.instruments_cache:
                    self.instruments_cache[symbol] = {**self.instruments_cache[symbol], **rules}
            except MarketError as error:
                if self.version == version and symbol in self.instruments_cache:
                    self.instruments_cache[symbol] = {**self.instruments_cache[symbol],
                        "tradingReady": False, "rulesError": str(error)}
                    self.rules_retry[symbol] = time.monotonic() + 30
            finally:
                self.dirty.add(symbol)
                self.rules_tasks.pop(symbol, None)

        task = asyncio.create_task(load())
        self.rules_tasks[symbol] = task
        await asyncio.shield(task)
        return self.instruments_cache.get(symbol)

    async def _subscriptions(self, socket):
        subscribed = set()
        last_ping = 0
        while True:
            symbols = self.needed_symbols() & self.instruments_cache.keys()
            desired = {f"tickers.{symbol}" for symbol in self.instruments_cache}
            desired |= {f"{topic}.{symbol}" for symbol in symbols for topic in ("orderbook.50", "publicTrade")}
            desired |= {f"kline.{INTERVALS[timeframe]}.{symbol}" for symbol, timeframe in ws_manager.subscriptions.values()
                        if symbol in self.instruments_cache and timeframe in INTERVALS}
            for operation, topics in (("unsubscribe", subscribed - desired), ("subscribe", desired - subscribed)):
                items = sorted(topics)
                for index in range(0, len(items), 100):
                    await socket.send_json({"op": operation, "args": items[index:index + 100]})
                    await asyncio.sleep(0.03)
            subscribed = desired
            if time.monotonic() - last_ping >= 20:
                await socket.send_json({"op": "ping"})
                last_ping = time.monotonic()
            await asyncio.sleep(1)

    async def _rules_loop(self):
        # REST latency must never delay WebSocket heartbeats.
        semaphore = asyncio.Semaphore(4)

        async def refresh(symbol):
            async with semaphore:
                with suppress(MarketError):
                    await self.ensure_rules(symbol)

        while True:
            await asyncio.gather(*(refresh(symbol) for symbol in self.needed_symbols()
                                   if symbol in self.instruments_cache), return_exceptions=True)
            await asyncio.sleep(10)

    async def _catalog(self):
        adapter = self.adapter
        catalog = await adapter.instruments()
        tickers = await adapter.get("/v5/market/tickers", {"category": "linear"})
        event_time = int(tickers.get("time") or timestamp())
        for ticker in tickers["result"]["list"]:
            symbol = ticker["symbol"]
            if symbol in catalog:
                catalog[symbol] = merge_ticker(catalog[symbol], ticker, event_time)
        self.instruments_cache = catalog
        self.emit("snapshot", instruments=list(catalog.values()), timeframes=list(INTERVALS))

    async def _run_source(self):
        delay = 1
        while True:
            subscription_task = None
            try:
                self.status, self.error = "connecting", None
                self.books, self.trades = {}, {}
                await self._catalog()
                async with self.session.ws_connect(self.adapter.ws_url, receive_timeout=45) as socket:
                    subscription_task = asyncio.create_task(self._subscriptions(socket))
                    started = time.monotonic()
                    async for message in socket:
                        if subscription_task.done():
                            await subscription_task
                        if message.type == aiohttp.WSMsgType.TEXT:
                            payload = json.loads(message.data)
                            if payload.get("op") == "subscribe" and payload.get("success") is False:
                                raise MarketError("subscription_rejected")
                            if payload.get("topic"):
                                self.last_message = timestamp()
                                self.status, self.error, delay = "live", None, 1
                                await self._process(payload)
                        elif message.type in (aiohttp.WSMsgType.ERROR, aiohttp.WSMsgType.CLOSED):
                            break
                        if time.monotonic() - started > 600:
                            break
                self.status, self.error = "stale", "source_reconnecting"
            except asyncio.CancelledError:
                raise
            except Exception as error:
                self.status = "error"
                self.error = str(error) if isinstance(error, MarketError) else "source_unavailable"
                logger.warning("Market source disconnected: {}", self.error)
            finally:
                if subscription_task:
                    subscription_task.cancel()
                    await asyncio.gather(subscription_task, return_exceptions=True)
                self.emit("status")
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30)

    async def _process(self, payload):
        topic, data = payload["topic"], payload["data"]
        symbol = topic.rsplit(".", 1)[1]
        if symbol not in self.instruments_cache:
            return
        if topic.startswith("tickers."):
            self.instruments_cache[symbol] = merge_ticker(self.instruments_cache[symbol], data, int(payload["ts"]))
            self.dirty.add(symbol)
        elif topic.startswith("orderbook."):
            self.books[symbol] = merge_orderbook(self.books.get(symbol), payload)
            self.emit("orderbook", symbol=symbol, book=self.books[symbol])
        elif topic.startswith("publicTrade."):
            trades = [{"id": item["i"], "symbol": symbol, "price": float(item["p"]),
                       "amount": float(item["v"]), "time": item["T"], "direction": item["S"].lower()} for item in data]
            combined = {row["id"]: row for row in trades + self.trades.get(symbol, [])}
            self.trades[symbol] = sorted(combined.values(), key=lambda row: row["time"], reverse=True)[:100]
            self.emit("trades", symbol=symbol, trades=self.trades[symbol])
        elif topic.startswith("kline."):
            interval = topic.split(".")[1]
            timeframe = next(key for key, value in INTERVALS.items() if value == interval)
            for row in data:
                candle = {"time": int(row["start"]) // 1000, "open": float(row["open"]),
                          "high": float(row["high"]), "low": float(row["low"]), "close": float(row["close"]),
                          "volume": float(row["volume"]), "confirmed": row["confirm"]}
                self.emit("candle", symbol=symbol, timeframe=timeframe, candle=candle)
        if symbol in self.demo_symbols and (topic.startswith("tickers.") or topic.startswith("orderbook.")):
            self.execution_sequence += 1
            event = {"sourceKey": self.source["key"], "version": self.version,
                     "sequence": self.execution_sequence,
                     "instrument": self.instruments_cache[symbol], "book": self.books.get(symbol),
                     "time": int(payload["ts"])}
            try:
                self.events.put_nowait(event)
            except asyncio.QueueFull:
                raise MarketError("execution_queue_full") from None

    def require_source(self):
        if not self.source or not self.adapter:
            raise MarketError("source_not_configured")
        return self.source

    def executable(self, symbol):
        instrument, book = self.instruments_cache.get(symbol), self.books.get(symbol)
        if self.effective_status() != "live" or not instrument or not book:
            raise MarketError("market_not_ready")
        now = timestamp()
        if (now - (instrument.get("receivedAt") or 0) > 15000
                or now - book["receivedAt"] > 15000 or not instrument.get("markPrice")):
            raise MarketError("market_stale")
        if not instrument.get("tradingReady") or now - (instrument.get("rulesUpdatedAt") or 0) > 60000:
            raise MarketError(instrument.get("rulesError") or "trading_rules_unavailable")
        return instrument, book


exchange_manager = ExchangeManager()
