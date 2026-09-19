import { create } from 'zustand';
import { calculatePnl, roundToStep } from '../domain/orderCalculations.ts';
import { validateOrder } from '../domain/orderValidation.ts';
import { isValidTriggerPrice } from '../domain/tpslCalculations.ts';
import type {
  AttachedTPSL,
  InstrumentSpec,
  PaperLedgerEntry,
  PaperOrder,
  PlacePaperOrderInput,
  TradingActionResult,
} from '../domain/types.ts';
import {
  calculateAvailableCloseQuantity,
  calculateOpeningQuantity,
  calculatePaperAccount,
  createId,
  fillOrder,
  initialTradingSnapshot,
  INITIAL_BALANCE,
  oppositeDirection,
} from '../engine/paperTradingEngine.ts';
import type { TradingSnapshot } from '../engine/paperTradingEngine.ts';

export { calculatePaperAccount } from '../engine/paperTradingEngine.ts';

export interface PlaceOrderResult {
  ok: boolean;
  status: PaperOrder['status'];
  orderId: string;
  reason: string | null;
}

interface PaperTradingState extends TradingSnapshot {
  placeOrder: (input: PlacePaperOrderInput) => PlaceOrderResult;
  cancelOrder: (orderId: string) => TradingActionResult;
  cancelAllOrders: (symbol?: string) => TradingActionResult;
  closePosition: (symbol: string, marketPrice: number, spec: InstrumentSpec, quantity?: number) => TradingActionResult;
  updatePositionTPSL: (symbol: string, tpsl: AttachedTPSL) => TradingActionResult;
  processMarketTick: (prices: Record<string, number>, specs: Record<string, InstrumentSpec>) => void;
  resetAccount: () => void;
}

export const usePaperTradingStore = create<PaperTradingState>((set, get) => ({
  ...initialTradingSnapshot(),

  placeOrder: (input) => {
    const current = get();
    const duplicate = current.orders.find((order) => order.clientOrderId === input.clientOrderId);
    if (duplicate) {
      return {
        ok: duplicate.status !== 'rejected',
        status: duplicate.status,
        orderId: duplicate.id,
        reason: duplicate.rejectReason,
      };
    }

    const timestamp = Date.now();
    const requestedPrice = input.type === 'limit' ? input.limitPrice : null;
    const referencePrice = requestedPrice ?? input.marketPrice;
    const openingQuantity = input.intent === 'open'
      ? calculateOpeningQuantity(
        current.positions,
        input.symbol,
        input.direction,
        input.quantity,
      )
      : 0;
    const maxCloseQuantity = input.intent === 'close'
      ? calculateAvailableCloseQuantity(
        current.positions,
        current.orders,
        input.symbol,
        oppositeDirection(input.direction),
      )
      : 0;
    const hasClosePosition = input.intent === 'close' && current.positions.some((position) => (
      position.symbol === input.symbol
      && position.direction === oppositeDirection(input.direction)
    ));
    const feeRate = input.type === 'limit' ? input.spec.makerFeeRate : input.spec.takerFeeRate;
    const required = openingQuantity * referencePrice * ((1 / input.leverage) + feeRate);
    const account = calculatePaperAccount(current);
    const orderId = createId('order');
    const validationErrors = validateOrder({
      intent: input.intent,
      symbol: input.symbol,
      orderType: input.type,
      price: referencePrice,
      marketPrice: input.marketPrice,
      quantity: input.quantity,
      notional: input.quantity * referencePrice,
      totalRequired: required,
      availableBalance: account.availableBalance,
      leverage: input.leverage,
      hasClosePosition,
      maxCloseQuantity,
      spec: input.spec,
    });
    const canPlace = validationErrors.length === 0;
    const rejectReason = validationErrors[0] ?? null;
    const order: PaperOrder = {
      id: orderId,
      clientOrderId: input.clientOrderId,
      symbol: input.symbol,
      direction: input.direction,
      intent: input.intent,
      reduceOnly: input.intent === 'close',
      type: input.type,
      status: canPlace ? 'pending' : 'rejected',
      quantity: input.quantity,
      filledQuantity: 0,
      remainingQuantity: input.quantity,
      requestedPrice,
      averageFillPrice: null,
      leverage: input.leverage,
      marginMode: input.marginMode,
      reservedMargin: canPlace && input.type === 'limit' ? required : 0,
      fee: 0,
      tpsl: input.tpsl,
      rejectReason,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    if (!canPlace) {
      set((state) => ({ orders: [order, ...state.orders] }));
      return { ok: false, status: 'rejected', orderId, reason: order.rejectReason };
    }

    const isMarketableLimit = input.type === 'limit' && requestedPrice !== null && (
      (input.direction === 'long' && input.marketPrice <= requestedPrice)
      || (input.direction === 'short' && input.marketPrice >= requestedPrice)
    );

    if (input.type === 'market' || isMarketableLimit) {
      const fillPrice = roundToStep(input.marketPrice, input.spec.tickSize);
      const snapshot: TradingSnapshot = {
        ...current,
        orders: [order, ...current.orders],
      };
      const next = fillOrder({ input, order, fillPrice, state: snapshot });
      set(next);
      return { ok: true, status: 'filled', orderId, reason: null };
    }

    set((state) => ({ orders: [order, ...state.orders] }));
    return { ok: true, status: 'pending', orderId, reason: null };
  },

  cancelOrder: (orderId) => {
    const current = get();
    const order = current.orders.find((item) => item.id === orderId);
    if (!order) {
      return { ok: false, code: 'order_not_found', affectedCount: 0, orderId };
    }
    if (order.status !== 'pending' && order.status !== 'partially_filled') {
      return { ok: false, code: 'order_not_open', affectedCount: 0, orderId };
    }

    const timestamp = Date.now();
    set((state) => {
      const entry: PaperLedgerEntry = {
        id: createId('ledger'),
        type: 'order_cancelled',
        symbol: order.symbol,
        amount: 0,
        balanceAfter: state.walletBalance,
        description: 'Order cancelled',
        createdAt: timestamp,
      };
      return {
        orders: state.orders.map((item) => item.id === orderId
          ? { ...item, status: 'cancelled' as const, reservedMargin: 0, updatedAt: timestamp }
          : item),
        ledger: [entry, ...state.ledger],
      };
    });
    return { ok: true, code: 'order_cancelled', affectedCount: 1, orderId };
  },

  cancelAllOrders: (symbol) => {
    const pending = get().orders.filter((order) => (
      (order.status === 'pending' || order.status === 'partially_filled')
      && (!symbol || order.symbol === symbol)
    ));
    if (pending.length === 0) {
      return { ok: false, code: 'no_open_orders', affectedCount: 0 };
    }
    const affectedCount = pending.reduce((total, order) => (
      total + (get().cancelOrder(order.id).ok ? 1 : 0)
    ), 0);
    return {
      ok: affectedCount > 0,
      code: affectedCount > 0 ? 'orders_cancelled' : 'no_open_orders',
      affectedCount,
    };
  },

  closePosition: (symbol, marketPrice, spec, quantity) => {
    const position = get().positions.find((item) => item.symbol === symbol);
    if (!position) {
      return { ok: false, code: 'position_not_found', affectedCount: 0 };
    }
    const requestedQuantity = quantity ?? position.quantity;
    const closeQuantity = roundToStep(
      Math.max(0, Math.min(position.quantity, requestedQuantity)),
      spec.quantityStep,
      'floor',
    );
    if (
      spec.symbol !== symbol
      || !Number.isFinite(marketPrice)
      || marketPrice <= 0
      || !Number.isFinite(requestedQuantity)
      || requestedQuantity <= 0
      || closeQuantity <= 0
    ) {
      return {
        ok: false,
        code: 'close_quantity_invalid',
        affectedCount: 0,
        positionId: position.id,
      };
    }

    get().orders
      .filter((order) => (
        order.symbol === symbol
        && (order.intent === 'close' || order.reduceOnly === true)
        && (order.status === 'pending' || order.status === 'partially_filled')
      ))
      .forEach((order) => { get().cancelOrder(order.id); });

    const input: PlacePaperOrderInput = {
      clientOrderId: createId('close'),
      symbol,
      direction: position.direction === 'long' ? 'short' : 'long',
      intent: 'close',
      type: 'market',
      quantity: closeQuantity,
      limitPrice: null,
      marketPrice,
      leverage: position.leverage,
      marginMode: position.marginMode,
      tpsl: { takeProfitPrice: null, stopLossPrice: null },
      spec,
    };
    const result = get().placeOrder(input);
    if (!result.ok || result.status !== 'filled') {
      return {
        ok: false,
        code: 'close_failed',
        affectedCount: 0,
        positionId: position.id,
        orderId: result.orderId,
      };
    }
    return {
      ok: true,
      code: closeQuantity >= position.quantity - Number.EPSILON
        ? 'position_closed'
        : 'position_partially_closed',
      affectedCount: 1,
      positionId: position.id,
      orderId: result.orderId,
      quantity: closeQuantity,
    };
  },

  updatePositionTPSL: (symbol, tpsl) => {
    const position = get().positions.find((item) => item.symbol === symbol);
    if (!position) {
      return { ok: false, code: 'position_not_found', affectedCount: 0 };
    }
    const hasInvalidTakeProfit = tpsl.takeProfitPrice !== null && (
      !Number.isFinite(tpsl.takeProfitPrice)
      || !isValidTriggerPrice(
        'tp',
        position.direction,
        tpsl.takeProfitPrice,
        position.averageEntryPrice,
      )
    );
    const hasInvalidStopLoss = tpsl.stopLossPrice !== null && (
      !Number.isFinite(tpsl.stopLossPrice)
      || !isValidTriggerPrice(
        'sl',
        position.direction,
        tpsl.stopLossPrice,
        position.averageEntryPrice,
      )
    );
    if (hasInvalidTakeProfit || hasInvalidStopLoss) {
      return {
        ok: false,
        code: 'tpsl_invalid',
        affectedCount: 0,
        positionId: position.id,
      };
    }
    set((state) => ({
      positions: state.positions.map((item) => item.symbol === symbol
        ? { ...item, tpsl, updatedAt: Date.now() }
        : item),
    }));
    return {
      ok: true,
      code: 'tpsl_updated',
      affectedCount: 1,
      positionId: position.id,
    };
  },

  processMarketTick: (prices, specs) => {
    set((state) => ({
      positions: state.positions.map((position) => {
        const markPrice = prices[position.symbol] ?? position.markPrice;
        const spec = specs[position.symbol];
        if (!spec) return position;
        const notional = position.quantity * markPrice;
        return {
          ...position,
          markPrice,
          maintenanceMargin: notional * spec.maintenanceMarginRate,
          unrealizedPnl: calculatePnl(
            position.direction,
            position.quantity,
            position.averageEntryPrice,
            markPrice,
          ),
          updatedAt: Date.now(),
        };
      }),
    }));

    const pendingOrders = get().orders.filter((order) => order.status === 'pending');
    pendingOrders.forEach((order) => {
      const marketPrice = prices[order.symbol];
      const spec = specs[order.symbol];
      if (!marketPrice || !spec || order.requestedPrice === null) return;
      const shouldFill = order.direction === 'long'
        ? marketPrice <= order.requestedPrice
        : marketPrice >= order.requestedPrice;
      if (!shouldFill) return;

      const input: PlacePaperOrderInput = {
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        direction: order.direction,
        intent: order.intent ?? (order.reduceOnly ? 'close' : 'open'),
        type: order.type,
        quantity: order.remainingQuantity,
        limitPrice: order.requestedPrice,
        marketPrice,
        leverage: order.leverage,
        marginMode: order.marginMode,
        tpsl: order.tpsl,
        spec,
      };
      const next = fillOrder({
        input,
        order,
        fillPrice: roundToStep(order.requestedPrice, spec.tickSize),
        state: get(),
      });
      set(next);
    });

    const positions = [...get().positions];
    positions.forEach((position) => {
      const marketPrice = prices[position.symbol];
      const spec = specs[position.symbol];
      if (!marketPrice || !spec) return;
      const hitLiquidation = position.direction === 'long'
        ? marketPrice <= position.liquidationPrice
        : marketPrice >= position.liquidationPrice;
      const hitTakeProfit = position.tpsl.takeProfitPrice !== null && (
        position.direction === 'long'
          ? marketPrice >= position.tpsl.takeProfitPrice
          : marketPrice <= position.tpsl.takeProfitPrice
      );
      const hitStopLoss = position.tpsl.stopLossPrice !== null && (
        position.direction === 'long'
          ? marketPrice <= position.tpsl.stopLossPrice
          : marketPrice >= position.tpsl.stopLossPrice
      );
      if (!hitLiquidation && !hitTakeProfit && !hitStopLoss) return;

      get().closePosition(position.symbol, marketPrice, spec);
      if (hitLiquidation) {
        set((state) => ({
          orders: state.orders.map((order) => (
            order.symbol === position.symbol
            && order.status === 'filled'
            && order.updatedAt === Math.max(...state.orders.filter((item) => item.symbol === position.symbol).map((item) => item.updatedAt))
              ? { ...order, status: 'liquidated' as const }
              : order
          )),
          ledger: [{
            id: createId('ledger'),
            type: 'liquidation',
            symbol: position.symbol,
            amount: 0,
            balanceAfter: state.walletBalance,
            description: 'Position liquidated',
            createdAt: Date.now(),
          }, ...state.ledger],
        }));
      }
    });
  },

  resetAccount: () => set({
    ...initialTradingSnapshot(),
    ledger: [{
      id: createId('ledger'),
      type: 'reset',
      symbol: null,
      amount: INITIAL_BALANCE,
      balanceAfter: INITIAL_BALANCE,
      description: 'Demo account reset',
      createdAt: Date.now(),
    }],
  }),
}));
