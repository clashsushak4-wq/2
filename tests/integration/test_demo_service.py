"""Local PostgreSQL integration checks, entirely inside a rolled-back transaction."""

import asyncio
import os
import unittest
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import uuid4

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

import backend.services.demo_service as module
from backend.services.bybit_market import timestamp
from backend.services.demo_engine import DemoError, serialize
from shared.database.core import engine
from tests.unit.test_demo_engine import book, instrument, request


@unittest.skipUnless(os.getenv("RUN_DEMO_DB_TESTS") == "1", "Explicit local DB test opt-in required")
class TestDemoPersistence(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        if engine.url.host not in {"127.0.0.1", "localhost", "::1"}:
            self.skipTest("Only loopback PostgreSQL is allowed")
        self.engine = create_async_engine(engine.url, poolclass=NullPool)
        self.connection = await self.engine.connect()
        self.transaction = await self.connection.begin()
        self.factory = async_sessionmaker(bind=self.connection, expire_on_commit=False,
                                         join_transaction_mode="create_savepoint")
        self.source = {"key": "integration:" + uuid4().hex, "id": -1, "name": "Bybit",
                       "environment": "testnet", "quote": "USDT", "initialBalance": 1000}
        self.quote = serialize(instrument(), public=True)
        self.quote.update(tradingReady=True, rulesUpdatedAt=timestamp(), receivedAt=timestamp())
        self.depth = book()
        self.depth["receivedAt"] = timestamp()
        self.market = SimpleNamespace(source=self.source, version="v1", instruments_cache={"TESTUSDT": self.quote},
            demo_symbols=set(), events=asyncio.Queue(), execution_sequence=10,
            effective_status=lambda: "live", require_source=lambda: self.source,
            executable=lambda symbol: (self.quote, self.depth), ensure_rules=AsyncMock())
        self.patches = [patch.object(module, "session_maker", self.factory), patch.object(module, "market", self.market)]
        for replacement in self.patches:
            replacement.start()
        self.service = module.DemoService()
        self.service.ready = True
        self.user_id = -int(uuid4().hex[:12], 16)
        created = await self.service.create_account(self.user_id, "v1")
        self.account_id = created["state"]["id"]

    async def asyncTearDown(self):
        for replacement in reversed(self.patches):
            replacement.stop()
        await self.transaction.rollback()
        await self.connection.close()
        await self.engine.dispose()

    async def command(self, **values):
        return await self.service.command(self.user_id, {"action": "order", "version": "v1",
            "accountId": self.account_id, **request(), **values})

    async def test_reset_archives_old_run_and_rejects_old_commands(self):
        await self.command()
        response = await self.command(action="reset", clientOrderId="reset-one")
        state = response["state"]
        self.assertFalse(state["positions"])
        self.assertEqual(state["walletBalance"], 1000)
        self.assertEqual(len(state["archives"][0]["positions"]), 1)
        repeated = await self.command(action="reset", clientOrderId="reset-one")
        self.assertEqual(repeated["state"]["id"], state["id"])
        with self.assertRaisesRegex(DemoError, "account_changed"):
            await self.command(clientOrderId="late-old-request")

    async def run_event(self, mark, depth, sequence=11, version="v1", event_time=None):
        quote = serialize(instrument(mark), public=True)
        quote.update(tradingReady=True, rulesUpdatedAt=timestamp(), receivedAt=timestamp())
        depth["receivedAt"] = timestamp()
        await self.market.events.put({"sourceKey": self.source["key"], "version": version,
            "sequence": sequence, "instrument": quote, "book": depth, "time": event_time or timestamp()})
        task = asyncio.create_task(self.service._execute_loop())
        await asyncio.sleep(0.3)
        task.cancel()
        await asyncio.gather(task, return_exceptions=True)

    async def test_account_persists_across_service_instances(self):
        await self.command()
        restarted = module.DemoService()
        state = (await restarted.get_state(self.user_id))["state"]
        self.assertEqual(len(state["positions"]), 1)
        self.assertAlmostEqual(state["walletBalance"], 999.93994)

    async def test_order_executes_without_browser(self):
        await self.command(type="limit", limitPrice="98")
        await self.run_event(97, book(bids=[[97, 3]], asks=[[97.1, 3]], update=2))
        state = (await self.service.get_state(self.user_id))["state"]
        self.assertEqual(state["orders"][0]["status"], "filled")
        self.assertEqual(state["positions"][0]["averageEntryPrice"], 97.1)

    async def test_duplicate_request_has_one_fill(self):
        first = await self.command()
        second = await self.command()
        self.assertEqual(first["result"]["orderId"], second["result"]["orderId"])
        self.assertEqual(len(second["state"]["fills"]), 1)

    async def test_stale_and_old_source_events_cannot_fill(self):
        await self.command(type="limit", limitPrice="98")
        await self.run_event(97, book(asks=[[97.1, 3]], update=2), event_time=timestamp() - 20000)
        await self.run_event(97, book(asks=[[97.1, 3]], update=3), version="old-source")
        state = (await self.service.get_state(self.user_id))["state"]
        self.assertEqual(state["orders"][0]["status"], "pending")
        self.assertFalse(state["fills"])

    async def test_queued_quote_before_command_is_ignored(self):
        await self.command(type="limit", limitPrice="98")
        await self.run_event(97, book(asks=[[97.1, 3]], update=2), sequence=10)
        state = (await self.service.get_state(self.user_id))["state"]
        self.assertFalse(state["fills"])

    async def test_stop_executes_on_worker_after_client_leaves(self):
        await self.command(tpsl={"takeProfitPrice": 105, "stopLossPrice": 95})
        await self.run_event(94, book(bids=[[93.9, 10]], update=2))
        state = (await self.service.get_state(self.user_id))["state"]
        self.assertFalse(state["positions"])
        self.assertEqual(state["fills"][-1]["reason"], "stop_loss")

    async def test_user_and_source_isolation(self):
        self.assertIsNone((await self.service.get_state(self.user_id - 1))["state"])
        self.assertIsNone((await self.service.get_state(self.user_id, "other-source"))["state"])
        with self.assertRaisesRegex(DemoError, "source_changed"):
            await self.command(version="old-version")
