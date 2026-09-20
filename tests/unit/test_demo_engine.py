import unittest
from copy import deepcopy
from decimal import Decimal

from backend.services.demo_engine import (
    DemoError, account_totals, apply_funding, cancel, new_account, place_order,
    process_market, restore, serialize,
)


def instrument(mark=100):
    return restore({"symbol": "TESTUSDT", "markPrice": mark, "tickSize": "0.1",
                    "quantityStep": "0.1", "minQuantity": "0.1", "minNotional": "5",
                    "maxQuantity": 1000, "maxMarketQuantity": 500, "maxLeverage": 50,
                    "leverageStep": "0.1", "makerFeeRate": "0.0002", "takerFeeRate": "0.0006",
                    "buyLimit": 1000, "sellLimit": 1,
                    "riskTiers": [{"limit": 100000, "maintenanceMarginRate": "0.005",
                                  "maintenanceMarginDeduction": 0, "maxLeverage": 50}]})


def book(bids=None, asks=None, update=1):
    return {"bids": bids or [[99.9, 10]], "asks": asks or [[100.1, 10]], "updateId": update}


def request(**values):
    return {"clientOrderId": "one", "symbol": "TESTUSDT", "direction": "long", "intent": "open",
            "type": "market", "quantity": "1", "leverage": "10", "marginMode": "isolated", **values}


class TestDemoEngine(unittest.TestCase):
    def setUp(self):
        self.state = new_account({"initialBalance": 1000, "key": "test"}, 1)
        self.instrument = instrument()

    def place(self, req=None, depth=None, now=10):
        return place_order(self.state, req or request(), self.instrument, depth or book(), "v1", now)

    def test_market_uses_ask_and_exact_fee(self):
        self.place()
        self.assertEqual(self.state["positions"][0]["averageEntryPrice"], Decimal("100.1"))
        self.assertEqual(self.state["walletBalance"], Decimal("999.93994"))

    def test_ioc_partial_does_not_invent_liquidity(self):
        order = self.place(request(quantity="2"), book(asks=[[100.1, 0.5], [100.2, 0.3]]))
        self.assertEqual(order["filledQuantity"], Decimal("0.8"))
        self.assertEqual(order["status"], "cancelled")
        self.assertEqual(order["reservedMargin"], 0)

    def test_same_snapshot_cannot_be_consumed_twice(self):
        depth = book(asks=[[100.1, 1]])
        self.place(depth=depth)
        second = self.place(request(clientOrderId="two"), depth)
        self.assertEqual(second["filledQuantity"], 0)

    def test_new_book_only_replenishes_observed_growth(self):
        self.place(depth=book(asks=[[100.1, 1]]))
        second = self.place(request(clientOrderId="two"), book(asks=[[100.1, 1]], update=2))
        self.assertEqual(second["filledQuantity"], 0)
        third = self.place(request(clientOrderId="three"), book(asks=[[100.1, 2]], update=3))
        self.assertEqual(third["filledQuantity"], 1)

    def test_client_id_is_idempotent(self):
        first = self.place()
        second = self.place()
        self.assertIs(first, second)
        self.assertEqual(len(self.state["fills"]), 1)

    def test_limit_reserves_and_cancel_releases_balance(self):
        order = self.place(request(type="limit", limitPrice="98"))
        self.assertEqual(order["status"], "pending")
        self.assertLess(account_totals(self.state)["availableBalance"], 1000)
        cancel(self.state, order, 20)
        self.assertEqual(account_totals(self.state)["availableBalance"], 1000)

    def test_resting_limit_fills_when_quote_crosses(self):
        order = self.place(request(type="limit", limitPrice="98"))
        process_market(self.state, instrument(97), book(bids=[[97, 3]], asks=[[97.1, 3]], update=2), "v1", 20)
        self.assertEqual(order["status"], "filled")
        self.assertEqual(self.state["fills"][0]["liquidity"], "maker")

    def test_reduce_only_cannot_reverse(self):
        self.place()
        with self.assertRaisesRegex(DemoError, "close_quantity_exceeded"):
            self.place(request(clientOrderId="close", intent="close", direction="short", quantity=2))
        self.assertEqual(self.state["positions"][0]["quantity"], 1)

    def test_close_realizes_pnl_and_removes_position(self):
        self.place()
        self.place(request(clientOrderId="close", intent="close", direction="short"),
                   book(bids=[[105, 1]], update=2))
        self.assertFalse(self.state["positions"])
        self.assertEqual(self.state["realizedPnl"], Decimal("4.9"))

    def test_opposing_open_order_nets_then_reverses(self):
        self.place()
        self.place(request(clientOrderId="reverse", direction="short", quantity=2),
                   book(bids=[[99.9, 3]], update=2))
        self.assertEqual(self.state["positions"][0]["direction"], "short")
        self.assertEqual(self.state["positions"][0]["quantity"], 1)

    def test_step_and_nonfinite_rejected(self):
        for quantity in ("0.15", "NaN", "Infinity"):
            with self.subTest(quantity=quantity), self.assertRaises(DemoError):
                self.place(request(quantity=quantity))

    def test_cross_margin_rejected(self):
        with self.assertRaisesRegex(DemoError, "isolated_margin_required"):
            self.place(request(marginMode="cross"))

    def test_balance_and_risk_limits_enforced(self):
        with self.assertRaisesRegex(DemoError, "insufficient_balance"):
            self.place(request(quantity=200))
        self.instrument["riskTiers"][0]["maxLeverage"] = Decimal(5)
        order = self.place()
        self.assertEqual(order["rejectReason"], "risk_leverage_exceeded")
        self.assertFalse(self.state["positions"])

    def test_tpsl_uses_mark_and_fills_on_depth_without_client(self):
        self.place(request(tpsl={"takeProfitPrice": 105, "stopLossPrice": 95}))
        process_market(self.state, instrument(106), book(bids=[[105.8, 10]], update=2), "v1", 20)
        self.assertFalse(self.state["positions"])
        self.assertEqual(self.state["fills"][-1]["reason"], "take_profit")
        self.assertEqual(self.state["fills"][-1]["price"], Decimal("105.8"))

    def test_partial_stop_remains_triggered_after_recovery(self):
        self.place(request(tpsl={"takeProfitPrice": None, "stopLossPrice": 95}))
        process_market(self.state, instrument(94), book(bids=[[94, 0.4]], update=2), "v1", 20)
        self.assertEqual(self.state["positions"][0]["quantity"], Decimal("0.6"))
        process_market(self.state, instrument(98), book(bids=[[98, 1]], update=3), "v1", 30)
        self.assertFalse(self.state["positions"])
        self.assertEqual(self.state["fills"][-1]["reason"], "stop_loss")

    def test_liquidation_has_priority_over_stop(self):
        self.place(request(tpsl={"takeProfitPrice": None, "stopLossPrice": 95}))
        process_market(self.state, instrument(80), book(bids=[[79.9, 10]], update=2), "v1", 20)
        self.assertFalse(self.state["positions"])
        self.assertEqual(self.state["fills"][-1]["reason"], "liquidation")

    def test_funding_reconstructs_exposure_and_is_idempotent(self):
        self.place(now=10)
        self.place(request(clientOrderId="close", intent="close", direction="short"), now=30)
        self.assertTrue(apply_funding(self.state, "TESTUSDT", 20, "0.001", 100, 40))
        self.assertFalse(apply_funding(self.state, "TESTUSDT", 20, "0.001", 100, 50))
        self.assertEqual(self.state["fundingPaid"], Decimal("0.1"))
        self.assertFalse(apply_funding(self.state, "TESTUSDT", 35, "0.001", 100, 50))

    def test_persistence_preserves_money_and_history(self):
        self.place()
        restored = restore(serialize(self.state))
        self.assertEqual(restored["walletBalance"], self.state["walletBalance"])
        self.assertEqual(restored["positions"], self.state["positions"])
        process_market(restored, instrument(106), book(update=2), "v2", 20)
        self.assertEqual(restored["positions"][0]["markPrice"], 106)
