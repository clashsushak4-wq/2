import unittest
from unittest.mock import AsyncMock

from backend.services.bybit_market import BybitMarket, MarketError, merge_orderbook, merge_ticker
from shared.market_settings import MarketSettings


class TestMarketNormalization(unittest.TestCase):
    def test_partial_ticker_preserves_price_percent_and_volume(self):
        initial = {"price": 100, "markPrice": 99, "changePercent": 5, "volume24h": 200, "updatedAt": 1}
        result = merge_ticker(initial, {"markPrice": "100.2"}, 2)
        self.assertEqual(result["price"], 100)
        self.assertEqual(result["changePercent"], 5)
        self.assertEqual(result["volume24h"], 200)
        self.assertEqual(result["markPrice"], 100.2)

    def test_old_ticker_ignored_and_percent_scaled(self):
        result = merge_ticker({}, {"lastPrice": "3", "price24hPcnt": "-0.025"}, 10)
        self.assertEqual(result["changePercent"], -2.5)
        self.assertIs(merge_ticker(result, {"lastPrice": "2"}, 9), result)

    def test_bad_ticker_values_do_not_replace_valid_data(self):
        result = merge_ticker({"price": 100, "markPrice": 99}, {"lastPrice": "NaN", "markPrice": "0"}, 10)
        self.assertEqual(result["price"], 100)
        self.assertEqual(result["markPrice"], 99)

    def test_snapshot_delta_delete_and_reset(self):
        first = merge_orderbook(None, {"type": "snapshot", "ts": 1,
            "data": {"s": "TESTUSDT", "u": 10, "b": [["99", "2"]], "a": [["101", "3"]]}})
        result = merge_orderbook(first, {"type": "delta", "ts": 2,
            "data": {"s": "TESTUSDT", "u": 11, "b": [["99", "0"], ["98", "4"]], "a": []}})
        self.assertEqual(result["bids"], [[98, 4]])
        self.assertEqual(result["asks"], [[101, 3]])
        reset = merge_orderbook(result, {"type": "delta", "ts": 3,
            "data": {"s": "TESTUSDT", "u": 1, "b": [["97", "1"]], "a": []}})
        self.assertEqual(reset["asks"], [])

    def test_delta_requires_snapshot(self):
        with self.assertRaises(MarketError):
            merge_orderbook(None, {"type": "delta", "data": {"u": 2}})


class TestCatalogPagination(unittest.IsolatedAsyncioTestCase):
    async def test_all_catalog_pages_are_read(self):
        adapter = BybitMarket(None, MarketSettings())
        adapter.get = AsyncMock(side_effect=[
            {"result": {"list": [], "nextPageCursor": "next"}},
            {"result": {"list": [], "nextPageCursor": ""}},
        ])
        await adapter.instruments()
        self.assertEqual(adapter.get.await_count, 2)
        self.assertEqual(adapter.get.call_args.args[1]["cursor"], "next")

    async def test_repeated_cursor_fails(self):
        adapter = BybitMarket(None, MarketSettings())
        adapter.get = AsyncMock(return_value={"result": {"list": [], "nextPageCursor": "next"}})
        with self.assertRaisesRegex(MarketError, "repeated_catalog_cursor"):
            await adapter.instruments()
