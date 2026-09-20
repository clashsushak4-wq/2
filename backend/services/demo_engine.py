"""Deterministic isolated-margin demo matching against observed Bybit depth.

No exchange orders are submitted. Resting limits use a quote-crossing model;
queue priority and hidden liquidity are not simulated.
"""

from copy import deepcopy
from decimal import Decimal, InvalidOperation, ROUND_DOWN
from uuid import uuid4

ZERO = Decimal(0)
ONE = Decimal(1)
OPEN = {"pending", "partially_filled"}
MONEY_FIELDS = {
    "startingBalance", "walletBalance", "realizedPnl", "paidFees", "fundingPaid",
    "quantity", "filledQuantity", "remainingQuantity", "requestedPrice",
    "averageFillPrice", "reservedMargin", "fee", "price", "amount", "balanceAfter",
    "averageEntryPrice", "markPrice", "initialMargin", "maintenanceMargin",
    "liquidationPrice", "unrealizedPnl", "accumulatedFees", "fundingAdjustment",
    "takeProfitPrice", "stopLossPrice", "tickSize", "quantityStep", "minQuantity",
    "minNotional", "maxQuantity", "maxMarketQuantity", "maxLeverage", "leverage",
    "leverageStep", "makerFeeRate", "takerFeeRate", "buyLimit", "sellLimit",
    "limit", "maintenanceMarginRate", "maintenanceMarginDeduction", "rate",
}


class DemoError(Exception):
    pass


def decimal(value):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, ValueError):
        raise DemoError("invalid_number") from None
    if not result.is_finite():
        raise DemoError("invalid_number")
    return result


def restore(value, key=""):
    if isinstance(value, dict):
        return {name: restore(item, name) for name, item in value.items()}
    if isinstance(value, list):
        return [restore(item, key) for item in value]
    return decimal(value) if value is not None and key in MONEY_FIELDS else value


def serialize(value, *, public=False):
    if isinstance(value, Decimal):
        return float(value) if public else str(value)
    if isinstance(value, dict):
        return {key: serialize(item, public=public) for key, item in value.items()}
    if isinstance(value, list):
        return [serialize(item, public=public) for item in value]
    return value


def new_account(source, now):
    balance = decimal(source["initialBalance"])
    return {"schemaVersion": 1, "id": uuid4().hex, "source": deepcopy(source), "revision": 0,
            "startingBalance": balance, "walletBalance": balance,
            "realizedPnl": ZERO, "paidFees": ZERO, "fundingPaid": ZERO,
            "orders": [], "positions": [], "fills": [], "ledger": [],
            "liquidity": {}, "fundingChecked": {}, "archives": [], "createdAt": now}


def position_for(state, symbol):
    return next((p for p in state["positions"] if p["symbol"] == symbol), None)


def account_totals(state):
    reserved = sum((o["reservedMargin"] for o in state["orders"] if o["status"] in OPEN), ZERO)
    margin = sum((max(ZERO, p["initialMargin"] + p["fundingAdjustment"]) for p in state["positions"]), ZERO)
    unrealized = sum((p["unrealizedPnl"] for p in state["positions"]), ZERO)
    # Isolated unrealized profit cannot collateralize another position.
    available = max(ZERO, state["walletBalance"] - reserved - margin)
    return {"startingBalance": state["startingBalance"], "walletBalance": state["walletBalance"],
            "reservedMargin": reserved, "positionMargin": margin, "unrealizedPnl": unrealized,
            "realizedPnl": state["realizedPnl"], "paidFees": state["paidFees"],
            "fundingPaid": state["fundingPaid"], "equity": state["walletBalance"] + unrealized,
            "availableBalance": available}


def public_state(state):
    result = {key: value for key, value in state.items() if key not in {"liquidity", "fundingChecked"}}
    return serialize({**result, "account": account_totals(state)}, public=True)


def reset_account(state, source, now, request_id):
    if state.get("resetRequestId") == request_id:
        return state
    archive = public_state({**state, "archives": []})
    archive.pop("archives", None)
    result = new_account(source, now)
    result["revision"] = state["revision"] + 1
    result["archives"] = [*state.get("archives", []), archive]
    result["resetRequestId"] = request_id
    return result


def ledger(state, kind, amount, symbol, now, description, **details):
    state["walletBalance"] += amount
    state["ledger"].append({"id": uuid4().hex, "type": kind, "symbol": symbol,
                           "amount": amount, "balanceAfter": state["walletBalance"],
                           "description": description, "createdAt": now, **details})


def risk_tier(instrument, notional):
    tiers = instrument["riskTiers"]
    for tier in tiers:
        if notional <= tier["limit"]:
            return tier
    raise DemoError("risk_limit_exceeded")


def revalue(position, instrument, now):
    quantity, entry = position["quantity"], position["averageEntryPrice"]
    mark = instrument["markPrice"]
    tier = risk_tier(instrument, quantity * mark)
    rate, deduction = tier["maintenanceMarginRate"], tier["maintenanceMarginDeduction"]
    close_fee = max(ZERO, instrument["takerFeeRate"])
    sign = ONE if position["direction"] == "long" else -ONE
    position["markPrice"] = mark
    position["unrealizedPnl"] = sign * quantity * (mark - entry)
    position["maintenanceMargin"] = max(ZERO, quantity * mark * rate - deduction) + quantity * mark * close_fee
    collateral = position["initialMargin"] + position["fundingAdjustment"]
    denominator = quantity * (sign - rate - close_fee)
    position["liquidationPrice"] = max(ZERO, (sign * quantity * entry - collateral - deduction) / denominator)
    position["updatedAt"] = now
    position["spec"] = instrument


def validate_tpsl(tpsl, direction, mark, tick):
    for key in ("takeProfitPrice", "stopLossPrice"):
        value = tpsl.get(key)
        if value is None:
            continue
        if value <= 0 or value % tick:
            raise DemoError("tpsl_invalid")
        above = (key == "takeProfitPrice") == (direction == "long")
        if (above and value <= mark) or (not above and value >= mark):
            raise DemoError("tpsl_invalid")


def reserve(order, instrument, position=None):
    if order["status"] not in OPEN or order["reduceOnly"]:
        order["reservedMargin"] = ZERO
    else:
        price = order["requestedPrice"] or instrument["markPrice"]
        opening = order["remainingQuantity"]
        if position and position["direction"] != order["direction"]:
            opening = max(ZERO, opening - position["quantity"])
        order["reservedMargin"] = price * (opening / order["leverage"]
            + order["remainingQuantity"] * max(ZERO, instrument["takerFeeRate"]))


def cancel(state, order, now, reason="order_cancelled"):
    if order["status"] not in OPEN:
        raise DemoError("order_not_open")
    order.update(status="cancelled", reservedMargin=ZERO, updatedAt=now, rejectReason=reason)
    ledger(state, "order_cancelled", ZERO, order["symbol"], now, reason, orderId=order["id"])


def sync_liquidity(state, symbol, book, version):
    previous = state["liquidity"].get(symbol)
    book_key = f'{version}:{book["updateId"]}'
    if previous and previous["key"] == book_key:
        return previous
    result = {"key": book_key, "version": version, "bids": {}, "asks": {}}
    for side in ("bids", "asks"):
        for raw_price, raw_size in book[side]:
            price, size = str(decimal(raw_price)), decimal(raw_size)
            old = previous[side].get(price) if previous and previous["version"] == version else None
            available = size if old is None else min(size, max(ZERO, decimal(old[1]) + size - decimal(old[0])))
            result[side][price] = [str(size), str(available)]
    state["liquidity"][symbol] = result
    return result


def apply_fill(state, order, quantity, price, fee_rate, instrument, now, reason):
    fee = quantity * price * fee_rate
    position = position_for(state, order["symbol"])
    remaining = quantity
    if position and position["direction"] != order["direction"]:
        closed = min(quantity, position["quantity"])
        sign = ONE if position["direction"] == "long" else -ONE
        pnl = sign * closed * (price - position["averageEntryPrice"])
        state["realizedPnl"] += pnl
        ledger(state, "realized_pnl", pnl, order["symbol"], now, reason, orderId=order["id"])
        fraction = closed / position["quantity"]
        position["quantity"] -= closed
        position["initialMargin"] *= ONE - fraction
        position["fundingAdjustment"] *= ONE - fraction
        position["realizedPnl"] += pnl
        remaining -= closed
        if not position["quantity"]:
            state["positions"].remove(position)
            position = None
    if remaining:
        if order["reduceOnly"]:
            raise DemoError("reduce_only_violation")
        if position is None:
            position = {"id": uuid4().hex, "symbol": order["symbol"], "direction": order["direction"],
                        "quantity": ZERO, "averageEntryPrice": ZERO, "markPrice": instrument["markPrice"],
                        "leverage": order["leverage"], "marginMode": "isolated",
                        "initialMargin": ZERO, "fundingAdjustment": ZERO, "maintenanceMargin": ZERO,
                        "liquidationPrice": ZERO, "unrealizedPnl": ZERO, "realizedPnl": ZERO,
                        "accumulatedFees": ZERO, "tpsl": deepcopy(order["tpsl"]),
                        "openedAt": now, "updatedAt": now, "triggered": None, "spec": instrument}
            state["positions"].append(position)
        total = position["quantity"] + remaining
        position["averageEntryPrice"] = (position["averageEntryPrice"] * position["quantity"] + price * remaining) / total
        position["quantity"] = total
        position["initialMargin"] += remaining * price / position["leverage"]
        position["tpsl"] = deepcopy(order["tpsl"])
    if position:
        position["accumulatedFees"] += fee
        revalue(position, instrument, now)
    state["paidFees"] += fee
    ledger(state, "fee", -fee, order["symbol"], now, reason, orderId=order["id"])
    filled = order["filledQuantity"]
    order["averageFillPrice"] = ((order["averageFillPrice"] or ZERO) * filled + quantity * price) / (filled + quantity)
    order["filledQuantity"] += quantity
    order["remainingQuantity"] -= quantity
    order["fee"] += fee
    order["status"] = "filled" if not order["remainingQuantity"] else "partially_filled"
    order["updatedAt"] = now
    state["fills"].append({"id": uuid4().hex, "orderId": order["id"], "symbol": order["symbol"],
                           "direction": order["direction"], "quantity": quantity, "price": price,
                           "fee": fee, "liquidity": "maker" if order["resting"] else "taker",
                           "reason": reason, "createdAt": now})


def match(state, order, instrument, book, version, now, reason="order_fill"):
    if order["status"] not in OPEN:
        return
    liquidity = sync_liquidity(state, order["symbol"], book, version)
    side = "asks" if order["direction"] == "long" else "bids"
    fee_rate = instrument["makerFeeRate"] if order["resting"] else instrument["takerFeeRate"]
    for raw_price, _ in book[side]:
        price = decimal(raw_price)
        limit = order["requestedPrice"]
        if limit is not None and ((side == "asks" and price > limit) or (side == "bids" and price < limit)):
            break
        if (side == "asks" and price > instrument["buyLimit"]) or (side == "bids" and price < instrument["sellLimit"]):
            break
        slot = liquidity[side][str(price)]
        quantity = min(order["remainingQuantity"], decimal(slot[1]))
        position = position_for(state, order["symbol"])
        if order["reduceOnly"]:
            if not position or position["direction"] == order["direction"]:
                cancel(state, order, now, "reduce_only_position_missing")
                break
            quantity = min(quantity, position["quantity"])
        elif position and position["direction"] == order["direction"] and position["leverage"] != order["leverage"]:
            cancel(state, order, now, "position_leverage_mismatch")
            break
        if quantity <= 0:
            continue
        quantity = (quantity / instrument["quantityStep"]).to_integral_value(rounding=ROUND_DOWN) * instrument["quantityStep"]
        if not quantity:
            continue
        opening = quantity
        if position and position["direction"] != order["direction"]:
            opening = max(ZERO, quantity - position["quantity"])
        if opening:
            future = opening + (position["quantity"] if position and position["direction"] == order["direction"] else ZERO)
            try:
                tier = risk_tier(instrument, future * max(price, instrument["markPrice"]))
                if order["leverage"] > tier["maxLeverage"]:
                    raise DemoError("risk_leverage_exceeded")
            except DemoError as error:
                cancel(state, order, now, str(error))
                break
            available = account_totals(state)["availableBalance"] + order["reservedMargin"]
            if position and position["direction"] != order["direction"]:
                available += min(quantity, position["quantity"]) / position["quantity"] * max(
                    ZERO, position["initialMargin"] + position["fundingAdjustment"])
            required = opening * price / order["leverage"] + quantity * price * max(ZERO, fee_rate)
            if required > available:
                cancel(state, order, now, "insufficient_balance")
                break
        apply_fill(state, order, quantity, price, fee_rate, instrument, now, reason)
        slot[1] = str(decimal(slot[1]) - quantity)
        reserve(order, instrument, position_for(state, order["symbol"]))
        if order["status"] == "filled":
            break
    if order["status"] in OPEN:
        if order["type"] == "market":
            cancel(state, order, now, "ioc_unfilled")
        else:
            order["resting"] = True
            reserve(order, instrument, position_for(state, order["symbol"]))


def place_order(state, request, instrument, book, version, now, *, reason="order_fill", internal=False):
    duplicate = next((o for o in state["orders"] if o["clientOrderId"] == request["clientOrderId"]), None)
    if duplicate:
        return duplicate
    quantity, leverage = decimal(request["quantity"]), decimal(request["leverage"])
    price = decimal(request["limitPrice"]) if request.get("limitPrice") is not None else None
    tpsl = restore(request.get("tpsl") or {"takeProfitPrice": None, "stopLossPrice": None})
    direction, intent, kind = request["direction"], request["intent"], request["type"]
    if direction not in {"long", "short"} or intent not in {"open", "close"} or kind not in {"market", "limit"}:
        raise DemoError("invalid_order")
    if request.get("marginMode") != "isolated":
        raise DemoError("isolated_margin_required")
    if quantity <= 0 or quantity % instrument["quantityStep"]:
        raise DemoError("invalid_quantity_step")
    if leverage < 1 or leverage > instrument["maxLeverage"] or leverage % instrument["leverageStep"]:
        raise DemoError("invalid_leverage")
    if kind == "limit" and (price is None or price <= 0 or price % instrument["tickSize"]):
        raise DemoError("invalid_limit_price")
    if kind == "market":
        price = None
    position = position_for(state, instrument["symbol"])
    if intent == "close":
        if not position or position["direction"] == direction:
            raise DemoError("position_not_found")
        reserved = sum((o["remainingQuantity"] for o in state["orders"]
                        if o["symbol"] == instrument["symbol"] and o["reduceOnly"] and o["status"] in OPEN), ZERO)
        if quantity > position["quantity"] - reserved:
            raise DemoError("close_quantity_exceeded")
    else:
        if quantity < instrument["minQuantity"] or quantity * (price or instrument["markPrice"]) < instrument["minNotional"]:
            raise DemoError("order_below_minimum")
        if position and position["direction"] == direction and position["leverage"] != leverage:
            raise DemoError("position_leverage_mismatch")
        validate_tpsl(tpsl, direction, instrument["markPrice"], instrument["tickSize"])
    maximum = instrument["maxMarketQuantity"] if kind == "market" else instrument["maxQuantity"]
    if not internal and quantity > maximum:
        raise DemoError("order_quantity_exceeded")
    if price is not None and ((direction == "long" and price > instrument["buyLimit"])
                              or (direction == "short" and price < instrument["sellLimit"])):
        raise DemoError("order_price_out_of_range")
    if not internal and len([o for o in state["orders"] if o["status"] in OPEN]) >= 100:
        raise DemoError("too_many_open_orders")
    order = {"id": uuid4().hex, "clientOrderId": request["clientOrderId"],
             "symbol": instrument["symbol"], "direction": direction, "intent": intent,
             "reduceOnly": intent == "close", "type": kind, "status": "pending",
             "quantity": quantity, "filledQuantity": ZERO, "remainingQuantity": quantity,
             "requestedPrice": price, "averageFillPrice": None, "leverage": leverage,
             "marginMode": "isolated", "reservedMargin": ZERO, "fee": ZERO, "tpsl": tpsl,
             "rejectReason": None, "createdAt": now, "updatedAt": now, "resting": False}
    reserve(order, instrument, position)
    if order["reservedMargin"] > account_totals(state)["availableBalance"]:
        raise DemoError("insufficient_balance")
    state["orders"].append(order)
    match(state, order, instrument, book, version, now, reason)
    state["revision"] += 1
    return order


def process_market(state, instrument, book, version, now):
    symbol = instrument["symbol"]
    position = position_for(state, symbol)
    if position:
        revalue(position, instrument, now)
        mark, tpsl = instrument["markPrice"], position["tpsl"]
        long = position["direction"] == "long"
        if position["initialMargin"] + position["fundingAdjustment"] + position["unrealizedPnl"] <= position["maintenanceMargin"]:
            position["triggered"] = "liquidation"
        elif position["triggered"] is None:
            if tpsl["stopLossPrice"] is not None and ((long and mark <= tpsl["stopLossPrice"]) or (not long and mark >= tpsl["stopLossPrice"])):
                position["triggered"] = "stop_loss"
            elif tpsl["takeProfitPrice"] is not None and ((long and mark >= tpsl["takeProfitPrice"]) or (not long and mark <= tpsl["takeProfitPrice"])):
                position["triggered"] = "take_profit"
        if position["triggered"]:
            reason = position["triggered"]
            for order in state["orders"]:
                if order["symbol"] == symbol and order["status"] in OPEN:
                    cancel(state, order, now, reason)
            liquidity = sync_liquidity(state, symbol, book, version)
            side = "bids" if long else "asks"
            if not any(decimal(slot[1]) >= instrument["quantityStep"] for slot in liquidity[side].values()):
                return
            # Persist the trigger until fresh observed liquidity fills the remainder.
            place_order(state, {"clientOrderId": uuid4().hex, "direction": "short" if long else "long",
                        "intent": "close", "type": "market", "quantity": position["quantity"],
                        "leverage": position["leverage"], "marginMode": "isolated"},
                        instrument, book, version, now, reason=reason, internal=True)
            if reason == "liquidation":
                ledger(state, "liquidation", ZERO, symbol, now, "Liquidation at observed depth")
            state["revision"] += 1
            return
    for order in state["orders"]:
        if order["symbol"] == symbol and order["status"] in OPEN:
            match(state, order, instrument, book, version, now)
    state["revision"] += 1


def apply_funding(state, symbol, event_time, rate, mark, now):
    funding_id = f"{symbol}:{event_time}"
    if any(row.get("fundingId") == funding_id for row in state["ledger"]):
        return False
    signed_quantity = sum((fill["quantity"] * (ONE if fill["direction"] == "long" else -ONE)
                           for fill in state["fills"] if fill["symbol"] == symbol and fill["createdAt"] < event_time), ZERO)
    if not signed_quantity:
        return False
    amount = -signed_quantity * decimal(rate) * decimal(mark)
    state["fundingPaid"] -= amount
    ledger(state, "funding", amount, symbol, now, "Funding at historical mark candle open",
           fundingId=funding_id, eventTime=event_time, rate=decimal(rate), markPrice=decimal(mark))
    position = position_for(state, symbol)
    if position and position["openedAt"] < event_time:
        position["fundingAdjustment"] += amount
    state["revision"] += 1
    return True
