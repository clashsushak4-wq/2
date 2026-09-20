"""Persistent demo accounts and background execution, independent of clients."""

import asyncio
import time
from contextlib import suppress
from copy import deepcopy

from loguru import logger
from sqlalchemy import select, text

from backend.services.bybit_market import MarketError, timestamp
from backend.services.demo_engine import (
    DemoError, OPEN, apply_funding, cancel, new_account, place_order, position_for,
    process_market, public_state, reset_account, restore, serialize, validate_tpsl,
)
from backend.services.exchange_manager import exchange_manager as market
from shared.database.core import engine, session_maker
from shared.database.models.demo import DemoAccount


def account_state(row):
    state = restore(deepcopy(row.snapshot))
    state.setdefault("id", f"account-{row.id}")
    state.setdefault("archives", [])
    return state


class DemoService:
    def __init__(self):
        self.task = None
        self.ready = False
        self.error = None
        self.watch = {}
        self.funding_status = {}
        self.funding_retry = {}

    async def start(self):
        self.task = asyncio.create_task(self._run())

    async def stop(self):
        if self.task:
            self.task.cancel()
            await asyncio.gather(self.task, return_exceptions=True)
        self.ready = False

    async def _run(self):
        while True:
            tasks = []
            try:
                async with engine.connect() as connection:
                    postgres = connection.dialect.name == "postgresql"
                    acquired = not postgres or await connection.scalar(text("SELECT pg_try_advisory_lock(738201941)"))
                    if not acquired:
                        self.error = "execution_worker_owned_by_another_process"
                        await asyncio.sleep(5)
                        continue
                    self.ready, self.error = True, None
                    tasks = [asyncio.create_task(self._watch_loop()), asyncio.create_task(self._execute_loop()),
                             asyncio.create_task(self._funding_loop())]
                    try:
                        await asyncio.gather(*tasks)
                    finally:
                        self.ready = False
                        for task in tasks:
                            task.cancel()
                        await asyncio.gather(*tasks, return_exceptions=True)
                        if postgres:
                            with suppress(Exception):
                                await connection.execute(text("SELECT pg_advisory_unlock(738201941)"))
            except asyncio.CancelledError:
                raise
            except Exception as error:
                self.ready, self.error = False, "execution_worker_unavailable"
                logger.error("Demo execution stopped: {}", type(error).__name__)
            await asyncio.sleep(3)

    async def _watch_loop(self):
        while True:
            source = market.source
            if source:
                async with session_maker() as session:
                    rows = (await session.execute(select(DemoAccount.id, DemoAccount.snapshot)
                            .where(DemoAccount.source_key == source["key"]))).all()
                watch = {}
                for account_id, snapshot in rows:
                    symbols = {p["symbol"] for p in snapshot["positions"]}
                    symbols |= {o["symbol"] for o in snapshot["orders"] if o["status"] in OPEN}
                    for symbol in symbols:
                        watch.setdefault(symbol, set()).add(account_id)
                self.watch = watch
                market.demo_symbols = set(watch)
            else:
                self.watch = {}
                market.demo_symbols = set()
            await asyncio.sleep(1)

    @staticmethod
    def valid_event(event):
        if not market.source or event["sourceKey"] != market.source["key"] or event["version"] != market.version:
            return False
        instrument, book, now = event["instrument"], event["book"], timestamp()
        return bool(market.effective_status() == "live" and book and instrument.get("markPrice")
                    and instrument.get("tradingReady") and 0 <= now - event["time"] < 15000
                    and now - (instrument.get("receivedAt") or 0) < 15000
                    and now - book["receivedAt"] < 15000
                    and now - (instrument.get("rulesUpdatedAt") or 0) < 60000)

    async def _execute_loop(self):
        while True:
            events = [await market.events.get()]
            await asyncio.sleep(0.1)
            while not market.events.empty() and len(events) < 500:
                events.append(market.events.get_nowait())
            events = [event for event in events if self.valid_event(event)]
            accounts = set()
            for event in events:
                accounts.update(self.watch.get(event["instrument"]["symbol"], set()))
            for account_id in sorted(accounts):
                async with session_maker() as session, session.begin():
                    row = await session.get(DemoAccount, account_id, with_for_update=True)
                    if row is None:
                        continue
                    state = account_state(row)
                    changed = False
                    for event in events:
                        symbol = event["instrument"]["symbol"]
                        if (row.source_key != event["sourceKey"] or not self.valid_event(event)
                                or account_id not in self.watch.get(symbol, set())
                                or (state.get("executionVersion") == event["version"]
                                    and event["sequence"] <= state.get("lastSequence", {}).get(symbol, -1))):
                            continue
                        try:
                            candidate = deepcopy(state)
                            process_market(candidate, restore(event["instrument"]), event["book"],
                                           event["version"], event["time"])
                        except DemoError as error:
                            state["executionError"] = str(error)
                            changed = True
                            break
                        state = candidate
                        if state.get("executionVersion") != event["version"]:
                            state["lastSequence"] = {}
                        state["executionVersion"] = event["version"]
                        state.setdefault("lastSequence", {})[symbol] = event["sequence"]
                        state["executionError"] = None
                        changed = True
                    if changed:
                        row.snapshot = serialize(state)

    async def _funding_loop(self):
        while True:
            if market.source and market.adapter:
                source_key, adapter = market.source["key"], market.adapter
                async with session_maker() as session:
                    rows = (await session.execute(select(DemoAccount.id, DemoAccount.snapshot)
                            .where(DemoAccount.source_key == source_key))).all()
                starts = {}
                for _, snapshot in rows:
                    for fill in snapshot["fills"]:
                        symbol = fill["symbol"]
                        start = snapshot.get("fundingChecked", {}).get(symbol, fill["createdAt"])
                        starts[symbol] = min(starts.get(symbol, start), start)
                for symbol, start in starts.items():
                    if time.monotonic() < self.funding_retry.get((source_key, symbol), 0):
                        continue
                    try:
                        # Leave a publication delay; unsettled funding is retried.
                        end = timestamp() - 120000
                        if start >= end:
                            continue
                        records, cursor = {}, end
                        while cursor > start:
                            response = await adapter.get("/v5/market/funding/history",
                                {"category": "linear", "symbol": symbol, "startTime": start,
                                 "endTime": cursor, "limit": 200})
                            page = response["result"]["list"]
                            for item in page:
                                records[int(item["fundingRateTimestamp"])] = item["fundingRate"]
                            if len(page) < 200:
                                break
                            following = min(int(item["fundingRateTimestamp"]) for item in page) - 1
                            if following >= cursor:
                                raise MarketError("invalid_funding_cursor")
                            cursor = following
                        settlements = []
                        for event_time, rate in sorted(records.items()):
                            response = await adapter.get("/v5/market/mark-price-kline",
                                {"category": "linear", "symbol": symbol, "interval": "1",
                                 "start": event_time, "end": event_time + 59999, "limit": 1})
                            candle = next((item for item in response["result"]["list"] if int(item[0]) == event_time), None)
                            if candle is None:
                                raise MarketError("funding_mark_unavailable")
                            settlements.append((event_time, rate, candle[1]))
                        if not market.source or market.source["key"] != source_key:
                            break
                        for account_id, _ in rows:
                            async with session_maker() as session, session.begin():
                                row = await session.get(DemoAccount, account_id, with_for_update=True)
                                state = account_state(row)
                                if not any(fill["symbol"] == symbol for fill in state["fills"]):
                                    continue
                                for event_time, rate, mark in settlements:
                                    apply_funding(state, symbol, event_time, rate, mark, timestamp())
                                state["fundingChecked"][symbol] = end
                                row.snapshot = serialize(state)
                        self.funding_status[(source_key, symbol)] = None
                    except MarketError as error:
                        self.funding_status[(source_key, symbol)] = str(error)
                    self.funding_retry[(source_key, symbol)] = time.monotonic() + 60
            await asyncio.sleep(5)

    def require_ready(self, version):
        if not self.ready:
            raise DemoError(self.error or "execution_worker_not_ready")
        source = market.require_source()
        if version != market.version:
            raise DemoError("source_changed")
        return source

    async def get_state(self, user_id, source_key=None):
        key = source_key or (market.source or {}).get("key")
        if not key:
            return {"state": None, "executionReady": self.ready, "executionError": self.error}
        async with session_maker() as session:
            row = await session.scalar(select(DemoAccount).where(
                DemoAccount.user_id == user_id, DemoAccount.source_key == key))
        return {"state": public_state(account_state(row)) if row else None,
                "executionReady": self.ready, "executionError": self.error,
                "activeSource": bool(market.source and key == market.source["key"]),
                "fundingErrors": {symbol: error for (source, symbol), error in self.funding_status.items()
                                  if source == key and error}}

    async def list_accounts(self, user_id):
        async with session_maker() as session:
            rows = (await session.scalars(select(DemoAccount).where(DemoAccount.user_id == user_id))).all()
        return [{"source": row.snapshot["source"], "createdAt": row.snapshot["createdAt"]} for row in rows]

    async def create_account(self, user_id, version):
        source = deepcopy(self.require_ready(version))
        async with session_maker() as session, session.begin():
            # Serializes creation even before the per-user row exists.
            if session.bind.dialect.name == "postgresql":
                await session.execute(text("SELECT pg_advisory_xact_lock(:key)"),
                                      {"key": user_id})
            row = await session.scalar(select(DemoAccount).where(
                DemoAccount.user_id == user_id, DemoAccount.source_key == source["key"]))
            if row is None:
                row = DemoAccount(user_id=user_id, source_key=source["key"],
                                  snapshot=serialize(new_account(source, timestamp())))
                session.add(row)
        return await self.get_state(user_id)

    async def command(self, user_id, request):
        source = self.require_ready(request["version"])
        action, symbol = request["action"], request.get("symbol")
        instrument = book = None
        if action in {"order", "close", "tpsl"}:
            if symbol not in market.instruments_cache:
                raise DemoError("unknown_instrument")
            market.demo_symbols.add(symbol)
            await market.ensure_rules(symbol)
            instrument, book = market.executable(symbol)
            instrument = restore(instrument)
            self.require_ready(request["version"])
        async with session_maker() as session, session.begin():
            row = await session.scalar(select(DemoAccount).where(
                DemoAccount.user_id == user_id, DemoAccount.source_key == source["key"]).with_for_update())
            if row is None:
                raise DemoError("demo_account_not_created")
            state, now = account_state(row), timestamp()
            result = {"ok": True, "affectedCount": 0}
            if action == "reset" and state.get("resetRequestId") == request.get("clientOrderId"):
                result.update(code="account_reset", affectedCount=1)
            elif request.get("accountId") != state["id"]:
                raise DemoError("account_changed")
            elif action == "reset":
                state = reset_account(state, source, now, request["clientOrderId"])
                result.update(code="account_reset", affectedCount=1)
            elif action in {"order", "close"}:
                duplicate = next((o for o in state["orders"] if o["clientOrderId"] == request["clientOrderId"]), None)
                if duplicate:
                    order = duplicate
                else:
                    if action == "close":
                        position = position_for(state, symbol)
                        if not position:
                            raise DemoError("position_not_found")
                        request = {**request, "direction": "short" if position["direction"] == "long" else "long",
                                   "intent": "close", "type": "market", "marginMode": "isolated",
                                   "quantity": request.get("quantity") or position["quantity"],
                                   "leverage": position["leverage"]}
                    order = place_order(state, request, instrument, book, market.version, now)
                result.update(orderId=order["id"], status=order["status"], reason=order["rejectReason"],
                              affectedCount=1, quantity=float(order["filledQuantity"]),
                              ok=order["status"] in OPEN or order["filledQuantity"] > 0,
                              code="position_closed" if action == "close" else "order_placed")
                self.watch.setdefault(symbol, set()).add(row.id)
            elif action in {"cancel", "cancel_all"}:
                orders = [o for o in state["orders"] if o["status"] in OPEN and
                          ((o["id"] == request.get("orderId")) if action == "cancel" else (not symbol or o["symbol"] == symbol))]
                if action == "cancel" and not orders:
                    raise DemoError("order_not_open")
                for order in orders:
                    cancel(state, order, now)
                result.update(code="order_cancelled" if action == "cancel" else "orders_cancelled",
                              affectedCount=len(orders))
            elif action == "tpsl":
                position = position_for(state, symbol)
                if not position:
                    raise DemoError("position_not_found")
                tpsl = restore(request["tpsl"])
                validate_tpsl(tpsl, position["direction"], instrument["markPrice"], instrument["tickSize"])
                if position["triggered"]:
                    raise DemoError("position_already_triggered")
                position.update(tpsl=tpsl, updatedAt=now)
                result.update(code="tpsl_updated", affectedCount=1)
            else:
                raise DemoError("unsupported_command")
            state["revision"] += 1
            if symbol and action in {"order", "close", "tpsl"}:
                if state.get("executionVersion") != market.version:
                    state["lastSequence"] = {}
                state["executionVersion"] = market.version
                state.setdefault("lastSequence", {})[symbol] = market.execution_sequence
            row.snapshot = serialize(state)
        return {**await self.get_state(user_id), "result": result}


demo_service = DemoService()
