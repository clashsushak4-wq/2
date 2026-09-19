import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_INSTRUMENT, toInstrumentSpec } from '../src/pages/trade/components/Crypto/data/mockInstruments';
import { calculatePaperAccount, usePaperTradingStore } from '../src/pages/trade/components/Crypto/store/usePaperTradingStore';
import type { PlacePaperOrderInput } from '../src/pages/trade/components/Crypto/domain/types';

const spec = toInstrumentSpec(DEFAULT_INSTRUMENT);

const createOrder = (overrides: Partial<PlacePaperOrderInput> = {}): PlacePaperOrderInput => ({
  clientOrderId: `test-${Date.now()}-${Math.random()}`,
  symbol: DEFAULT_INSTRUMENT.symbol,
  direction: 'long',
  intent: 'open',
  type: 'market',
  quantity: 0.01,
  limitPrice: null,
  marketPrice: DEFAULT_INSTRUMENT.price,
  leverage: 3,
  marginMode: 'isolated',
  tpsl: { takeProfitPrice: null, stopLossPrice: null },
  spec,
  ...overrides,
});

test.beforeEach(() => {
  usePaperTradingStore.getState().resetAccount();
});

test('market order is filled and creates a position', () => {
  const result = usePaperTradingStore.getState().placeOrder(createOrder());
  const state = usePaperTradingStore.getState();
  const account = calculatePaperAccount(state);

  assert.equal(result.ok, true);
  assert.equal(result.status, 'filled');
  assert.equal(state.positions.length, 1);
  assert.equal(state.fills.length, 1);
  assert.ok(account.paidFees > 0);
  assert.ok(account.availableBalance < account.startingBalance);
});

test('reusing client order id does not duplicate an order or fill', () => {
  const input = createOrder({ clientOrderId: 'stable-client-order-id' });
  const first = usePaperTradingStore.getState().placeOrder(input);
  const second = usePaperTradingStore.getState().placeOrder(input);
  const state = usePaperTradingStore.getState();

  assert.equal(second.orderId, first.orderId);
  assert.equal(state.orders.length, 1);
  assert.equal(state.fills.length, 1);
});

test('limit order reserves margin, can be cancelled and releases it', () => {
  const result = usePaperTradingStore.getState().placeOrder(createOrder({
    type: 'limit',
    limitPrice: DEFAULT_INSTRUMENT.price - 100,
  }));
  const reserved = calculatePaperAccount(usePaperTradingStore.getState()).reservedMargin;

  assert.equal(result.status, 'pending');
  assert.ok(reserved > 0);

  const cancelled = usePaperTradingStore.getState().cancelOrder(result.orderId);
  const account = calculatePaperAccount(usePaperTradingStore.getState());
  const repeated = usePaperTradingStore.getState().cancelOrder(result.orderId);
  assert.equal(cancelled.code, 'order_cancelled');
  assert.equal(repeated.code, 'order_not_open');
  assert.equal(account.reservedMargin, 0);
  assert.equal(usePaperTradingStore.getState().orders[0].status, 'cancelled');
});

test('pending limit order fills when mock market crosses its price', () => {
  const limitPrice = DEFAULT_INSTRUMENT.price - 50;
  const result = usePaperTradingStore.getState().placeOrder(createOrder({
    type: 'limit',
    limitPrice,
  }));

  usePaperTradingStore.getState().processMarketTick(
    { [DEFAULT_INSTRUMENT.symbol]: limitPrice - 1 },
    { [DEFAULT_INSTRUMENT.symbol]: spec },
  );

  const order = usePaperTradingStore.getState().orders.find((item) => item.id === result.orderId);
  assert.equal(order?.status, 'filled');
  assert.equal(usePaperTradingStore.getState().positions.length, 1);
});

test('opposite order nets and reverses a one-way position', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: 0.01 }));
  usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    quantity: 0.015,
  }));

  const positions = usePaperTradingStore.getState().positions;
  assert.equal(positions.length, 1);
  assert.equal(positions[0].direction, 'short');
  assert.ok(Math.abs(positions[0].quantity - 0.005) < 1e-10);
});

test('partial market close reduces position size and keeps its triggers', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({
    quantity: 0.02,
    tpsl: {
      takeProfitPrice: DEFAULT_INSTRUMENT.price + 100,
      stopLossPrice: DEFAULT_INSTRUMENT.price - 100,
    },
  }));
  const result = usePaperTradingStore.getState().closePosition(
    DEFAULT_INSTRUMENT.symbol,
    DEFAULT_INSTRUMENT.price,
    spec,
    0.01,
  );

  const position = usePaperTradingStore.getState().positions[0];
  assert.equal(result.code, 'position_partially_closed');
  assert.equal(result.quantity, 0.01);
  assert.equal(position.quantity, 0.01);
  assert.equal(position.tpsl.takeProfitPrice, DEFAULT_INSTRUMENT.price + 100);
  assert.equal(position.tpsl.stopLossPrice, DEFAULT_INSTRUMENT.price - 100);
});

test('full position close returns a result and removes the position', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: 0.01 }));

  const result = usePaperTradingStore.getState().closePosition(
    DEFAULT_INSTRUMENT.symbol,
    DEFAULT_INSTRUMENT.price,
    spec,
  );
  const repeated = usePaperTradingStore.getState().closePosition(
    DEFAULT_INSTRUMENT.symbol,
    DEFAULT_INSTRUMENT.price,
    spec,
  );

  assert.equal(result.code, 'position_closed');
  assert.equal(result.quantity, 0.01);
  assert.equal(repeated.code, 'position_not_found');
  assert.equal(usePaperTradingStore.getState().positions.length, 0);
});

test('take profit closes the position and removes its attached stop loss', () => {
  const takeProfitPrice = DEFAULT_INSTRUMENT.price + 100;
  usePaperTradingStore.getState().placeOrder(createOrder({
    tpsl: {
      takeProfitPrice,
      stopLossPrice: DEFAULT_INSTRUMENT.price - 100,
    },
  }));

  usePaperTradingStore.getState().processMarketTick(
    { [DEFAULT_INSTRUMENT.symbol]: takeProfitPrice + 1 },
    { [DEFAULT_INSTRUMENT.symbol]: spec },
  );

  assert.equal(usePaperTradingStore.getState().positions.length, 0);
  assert.ok(usePaperTradingStore.getState().realizedPnl > 0);
});

test('reduce-only market order partially closes a long without reversing it', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: 0.02 }));
  const result = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
    quantity: 0.01,
  }));

  const position = usePaperTradingStore.getState().positions[0];
  assert.equal(result.status, 'filled');
  assert.equal(position.direction, 'long');
  assert.equal(position.quantity, 0.01);
});

test('reduce-only order is rejected when there is no matching position', () => {
  const result = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'position_not_found');
  assert.equal(usePaperTradingStore.getState().positions.length, 0);
});

test('reduce-only order cannot exceed or reverse the current position', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: 0.01 }));
  const result = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
    quantity: 0.015,
  }));

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'close_quantity_exceeded');
  assert.equal(usePaperTradingStore.getState().positions[0].direction, 'long');
  assert.equal(usePaperTradingStore.getState().positions[0].quantity, 0.01);
});

test('pending reduce-only limits reserve closeable position quantity', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: 0.02 }));
  const first = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
    type: 'limit',
    quantity: 0.01,
    limitPrice: DEFAULT_INSTRUMENT.price + 100,
  }));
  const second = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
    type: 'limit',
    quantity: 0.011,
    limitPrice: DEFAULT_INSTRUMENT.price + 200,
  }));

  assert.equal(first.status, 'pending');
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'close_quantity_exceeded');
  assert.equal(calculatePaperAccount(usePaperTradingStore.getState()).reservedMargin, 0);
});

test('stale reduce-only limit is capped at the remaining position and never reverses it', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: 0.02 }));
  const closeResult = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
    type: 'limit',
    quantity: 0.02,
    limitPrice: DEFAULT_INSTRUMENT.price + 100,
  }));
  usePaperTradingStore.setState((state) => ({
    positions: state.positions.map((position) => ({ ...position, quantity: 0.01 })),
  }));

  usePaperTradingStore.getState().processMarketTick(
    { [DEFAULT_INSTRUMENT.symbol]: DEFAULT_INSTRUMENT.price + 101 },
    { [DEFAULT_INSTRUMENT.symbol]: spec },
  );

  const order = usePaperTradingStore.getState().orders.find((item) => item.id === closeResult.orderId);
  assert.equal(usePaperTradingStore.getState().positions.length, 0);
  assert.equal(order?.status, 'filled');
  assert.equal(order?.filledQuantity, 0.01);
});

test('reduce-only buy closes a short position', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    quantity: 0.01,
  }));
  const result = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'long',
    intent: 'close',
    quantity: 0.01,
  }));

  assert.equal(result.status, 'filled');
  assert.equal(usePaperTradingStore.getState().positions.length, 0);
});

test('cancel all reports affected orders and ignores finalized orders', () => {
  const first = usePaperTradingStore.getState().placeOrder(createOrder({
    type: 'limit',
    limitPrice: DEFAULT_INSTRUMENT.price - 100,
  }));
  const second = usePaperTradingStore.getState().placeOrder(createOrder({
    type: 'limit',
    limitPrice: DEFAULT_INSTRUMENT.price - 200,
  }));

  const result = usePaperTradingStore.getState().cancelAllOrders(DEFAULT_INSTRUMENT.symbol);
  const repeated = usePaperTradingStore.getState().cancelAllOrders(DEFAULT_INSTRUMENT.symbol);

  assert.equal(result.ok, true);
  assert.equal(result.affectedCount, 2);
  assert.equal(repeated.code, 'no_open_orders');
  assert.equal(usePaperTradingStore.getState().orders.find((order) => order.id === first.orderId)?.status, 'cancelled');
  assert.equal(usePaperTradingStore.getState().orders.find((order) => order.id === second.orderId)?.status, 'cancelled');
});

test('invalid dust close keeps existing reduce-only orders untouched', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: spec.quantityStep }));
  const pendingClose = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
    type: 'limit',
    quantity: spec.quantityStep,
    limitPrice: DEFAULT_INSTRUMENT.price + 100,
  }));

  const result = usePaperTradingStore.getState().closePosition(
    DEFAULT_INSTRUMENT.symbol,
    DEFAULT_INSTRUMENT.price,
    spec,
    spec.quantityStep * 0.25,
  );

  assert.equal(result.code, 'close_quantity_invalid');
  assert.equal(usePaperTradingStore.getState().orders.find((order) => order.id === pendingClose.orderId)?.status, 'pending');
  assert.equal(usePaperTradingStore.getState().positions[0].quantity, spec.quantityStep);
});

test('position removal automatically cancels orphan reduce-only orders', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ quantity: 0.02 }));
  const pendingClose = usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    intent: 'close',
    type: 'limit',
    quantity: 0.01,
    limitPrice: DEFAULT_INSTRUMENT.price + 100,
  }));

  usePaperTradingStore.getState().placeOrder(createOrder({
    direction: 'short',
    quantity: 0.02,
  }));

  const order = usePaperTradingStore.getState().orders.find((item) => item.id === pendingClose.orderId);
  assert.equal(usePaperTradingStore.getState().positions.length, 0);
  assert.equal(order?.status, 'cancelled');
  assert.equal(order?.rejectReason, 'reduce_only_no_position');
});

test('store rejects mismatched instruments and invalid quantity steps', () => {
  const mismatched = usePaperTradingStore.getState().placeOrder(createOrder({
    spec: { ...spec, symbol: 'ETHUSDT' },
  }));
  const invalidStep = usePaperTradingStore.getState().placeOrder(createOrder({
    quantity: 0.0105,
  }));
  const belowMinimum = usePaperTradingStore.getState().placeOrder(createOrder({
    spec: { ...spec, minQuantity: 0.02 },
  }));
  const outsidePriceBand = usePaperTradingStore.getState().placeOrder(createOrder({
    type: 'limit',
    limitPrice: DEFAULT_INSTRUMENT.price * (1 + spec.priceBandPercent + 0.01),
  }));

  assert.equal(mismatched.reason, 'instrument_mismatch');
  assert.equal(invalidStep.reason, 'quantity_step_invalid');
  assert.equal(belowMinimum.reason, 'quantity_below_minimum');
  assert.equal(outsidePriceBand.reason, 'price_out_of_band');
  assert.equal(usePaperTradingStore.getState().positions.length, 0);
});

test('TP/SL update returns an explicit action result', () => {
  usePaperTradingStore.getState().placeOrder(createOrder());
  const result = usePaperTradingStore.getState().updatePositionTPSL(
    DEFAULT_INSTRUMENT.symbol,
    { takeProfitPrice: DEFAULT_INSTRUMENT.price + 100, stopLossPrice: null },
  );
  const missing = usePaperTradingStore.getState().updatePositionTPSL(
    'UNKNOWN',
    { takeProfitPrice: null, stopLossPrice: null },
  );
  const invalid = usePaperTradingStore.getState().updatePositionTPSL(
    DEFAULT_INSTRUMENT.symbol,
    { takeProfitPrice: DEFAULT_INSTRUMENT.price - 100, stopLossPrice: null },
  );

  assert.equal(result.code, 'tpsl_updated');
  assert.equal(missing.code, 'position_not_found');
  assert.equal(invalid.code, 'tpsl_invalid');
});

test('mixing leverage for the same position is rejected', () => {
  usePaperTradingStore.getState().placeOrder(createOrder({ leverage: 5 }));
  const result = usePaperTradingStore.getState().placeOrder(createOrder({ leverage: 10 }));
  
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'invalid_leverage_for_position');
  assert.equal(usePaperTradingStore.getState().positions[0].leverage, 5);
});

test('marketable limit order is filled immediately and acts as taker', () => {
  const limitPrice = DEFAULT_INSTRUMENT.price + 50; // Buy price higher than market price
  const result = usePaperTradingStore.getState().placeOrder(createOrder({
    type: 'limit',
    limitPrice,
    isMarketableLimit: true,
  }));
  
  const state = usePaperTradingStore.getState();
  assert.equal(result.ok, true);
  assert.equal(result.status, 'filled');
  assert.equal(state.positions.length, 1);
  
  const order = state.orders.find(o => o.id === result.orderId);
  const expectedTakerFee = order!.filledQuantity * order!.averageFillPrice! * spec.takerFeeRate;
  assert.ok(Math.abs(order!.fee - expectedTakerFee) < 1e-8);
});
