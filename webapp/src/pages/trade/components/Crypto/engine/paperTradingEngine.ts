import { calculateLiquidationPrice, calculatePnl } from '../domain/orderCalculations.ts';
import type {
  PaperAccount,
  PaperFill,
  PaperLedgerEntry,
  PaperOrder,
  PaperPosition,
  PlacePaperOrderInput,
  TradeDirection,
} from '../domain/types.ts';

export const INITIAL_BALANCE = 5_300;

export const createId = (prefix: string): string => {
  const randomPart = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${randomPart}`;
};

export interface TradingSnapshot {
  walletBalance: number;
  realizedPnl: number;
  paidFees: number;
  orders: PaperOrder[];
  fills: PaperFill[];
  positions: PaperPosition[];
  ledger: PaperLedgerEntry[];
}

export const initialTradingSnapshot = (): TradingSnapshot => ({
  walletBalance: INITIAL_BALANCE,
  realizedPnl: 0,
  paidFees: 0,
  orders: [],
  fills: [],
  positions: [],
  ledger: [],
});

export const calculatePaperAccount = (state: TradingSnapshot): PaperAccount => {
  const reservedMargin = state.orders
    .filter((order) => order.status === 'pending' || order.status === 'partially_filled')
    .reduce((total, order) => total + order.reservedMargin, 0);
  const positionMargin = state.positions.reduce((total, position) => total + position.initialMargin, 0);
  const unrealizedPnl = state.positions.reduce((total, position) => total + position.unrealizedPnl, 0);
  const equity = state.walletBalance + unrealizedPnl;

  return {
    startingBalance: INITIAL_BALANCE,
    walletBalance: state.walletBalance,
    reservedMargin,
    positionMargin,
    unrealizedPnl,
    realizedPnl: state.realizedPnl,
    paidFees: state.paidFees,
    equity,
    availableBalance: Math.max(0, equity - reservedMargin - positionMargin),
  };
};

export const calculateOpeningQuantity = (
  positions: PaperPosition[],
  symbol: string,
  direction: TradeDirection,
  quantity: number,
): number => {
  const existing = positions.find((position) => position.symbol === symbol);
  if (!existing || existing.direction === direction) return quantity;
  return Math.max(0, quantity - existing.quantity);
};

export const oppositeDirection = (direction: TradeDirection): TradeDirection => (
  direction === 'long' ? 'short' : 'long'
);

export const calculateAvailableCloseQuantity = (
  positions: PaperPosition[],
  orders: PaperOrder[],
  symbol: string,
  positionDirection: TradeDirection,
): number => {
  const position = positions.find((item) => (
    item.symbol === symbol && item.direction === positionDirection
  ));
  if (!position) return 0;

  const executionDirection = oppositeDirection(positionDirection);
  const reservedQuantity = orders
    .filter((order) => (
      order.symbol === symbol
      && order.direction === executionDirection
      && (order.intent === 'close' || order.reduceOnly === true)
      && (order.status === 'pending' || order.status === 'partially_filled')
    ))
    .reduce((total, order) => total + order.remainingQuantity, 0);

  return Math.max(0, position.quantity - reservedQuantity);
};

const createPosition = (
  input: PlacePaperOrderInput,
  quantity: number,
  fillPrice: number,
  fee: number,
  timestamp: number,
): PaperPosition => {
  const notional = quantity * fillPrice;
  const initialMargin = notional / input.leverage;
  return {
    id: createId('position'),
    symbol: input.symbol,
    direction: input.direction,
    quantity,
    averageEntryPrice: fillPrice,
    markPrice: fillPrice,
    leverage: input.leverage,
    marginMode: input.marginMode,
    initialMargin,
    maintenanceMargin: notional * input.spec.maintenanceMarginRate,
    liquidationPrice: calculateLiquidationPrice(
      input.direction,
      fillPrice,
      input.leverage,
      input.spec.maintenanceMarginRate,
    ),
    unrealizedPnl: 0,
    realizedPnl: 0,
    accumulatedFees: fee,
    tpsl: input.tpsl,
    openedAt: timestamp,
    updatedAt: timestamp,
  };
};

interface PositionUpdateResult {
  positions: PaperPosition[];
  realizedPnl: number;
  executedQuantity: number;
}

const applyFillToPositions = (
  positions: PaperPosition[],
  input: PlacePaperOrderInput,
  fillPrice: number,
  fee: number,
  timestamp: number,
): PositionUpdateResult => {
  const existingIndex = positions.findIndex((position) => position.symbol === input.symbol);
  if (existingIndex < 0) {
    if (input.intent === 'close') {
      return { positions, realizedPnl: 0, executedQuantity: 0 };
    }
    return {
      positions: [...positions, createPosition(input, input.quantity, fillPrice, fee, timestamp)],
      realizedPnl: 0,
      executedQuantity: input.quantity,
    };
  }

  const existing = positions[existingIndex];
  if (existing.direction === input.direction) {
    if (input.intent === 'close') {
      return { positions, realizedPnl: 0, executedQuantity: 0 };
    }
    const quantity = existing.quantity + input.quantity;
    const averageEntryPrice = (
      (existing.averageEntryPrice * existing.quantity) + (fillPrice * input.quantity)
    ) / quantity;
    const notional = quantity * averageEntryPrice;
    const updated: PaperPosition = {
      ...existing,
      quantity,
      averageEntryPrice,
      markPrice: fillPrice,
      leverage: input.leverage,
      marginMode: input.marginMode,
      initialMargin: existing.initialMargin + ((input.quantity * fillPrice) / input.leverage),
      maintenanceMargin: notional * input.spec.maintenanceMarginRate,
      liquidationPrice: calculateLiquidationPrice(
        existing.direction,
        averageEntryPrice,
        input.leverage,
        input.spec.maintenanceMarginRate,
      ),
      unrealizedPnl: calculatePnl(existing.direction, quantity, averageEntryPrice, fillPrice),
      accumulatedFees: existing.accumulatedFees + fee,
      tpsl: {
        takeProfitPrice: input.tpsl.takeProfitPrice !== null ? input.tpsl.takeProfitPrice : existing.tpsl.takeProfitPrice,
        stopLossPrice: input.tpsl.stopLossPrice !== null ? input.tpsl.stopLossPrice : existing.tpsl.stopLossPrice,
      },
      updatedAt: timestamp,
    };
    return {
      positions: positions.map((position, index) => index === existingIndex ? updated : position),
      realizedPnl: 0,
      executedQuantity: input.quantity,
    };
  }

  const closedQuantity = Math.min(existing.quantity, input.quantity);
  const realizedPnl = calculatePnl(
    existing.direction,
    closedQuantity,
    existing.averageEntryPrice,
    fillPrice,
  );
  const remainingExisting = existing.quantity - closedQuantity;
  const remainingIncoming = input.quantity - closedQuantity;

  if (remainingExisting > 0) {
    const ratio = remainingExisting / existing.quantity;
    const updated: PaperPosition = {
      ...existing,
      quantity: remainingExisting,
      markPrice: fillPrice,
      initialMargin: existing.initialMargin * ratio,
      maintenanceMargin: existing.maintenanceMargin * ratio,
      unrealizedPnl: calculatePnl(
        existing.direction,
        remainingExisting,
        existing.averageEntryPrice,
        fillPrice,
      ),
      realizedPnl: existing.realizedPnl + realizedPnl,
      accumulatedFees: existing.accumulatedFees + fee,
      updatedAt: timestamp,
    };
    return {
      positions: positions.map((position, index) => index === existingIndex ? updated : position),
      realizedPnl,
      executedQuantity: closedQuantity,
    };
  }

  const withoutExisting = positions.filter((_, index) => index !== existingIndex);
  if (remainingIncoming <= 0 || input.intent === 'close') {
    return { positions: withoutExisting, realizedPnl, executedQuantity: closedQuantity };
  }

  return {
    positions: [
      ...withoutExisting,
      createPosition(input, remainingIncoming, fillPrice, fee, timestamp),
    ],
    realizedPnl,
    executedQuantity: input.quantity,
  };
};

interface FillOrderOptions {
  input: PlacePaperOrderInput;
  order: PaperOrder;
  fillPrice: number;
  state: TradingSnapshot;
}

const reconcileReduceOnlyOrders = (
  state: TradingSnapshot,
  timestamp: number,
): TradingSnapshot => {
  const pendingReduceOnly = state.orders
    .filter((order) => (
      (order.intent === 'close' || order.reduceOnly === true)
      && (order.status === 'pending' || order.status === 'partially_filled')
    ))
    .sort((left, right) => left.createdAt - right.createdAt);
  if (pendingReduceOnly.length === 0) return state;

  const remainingCapacity = new Map<string, number>();
  const cancelled = new Map<string, string>();

  for (const order of pendingReduceOnly) {
    const position = state.positions.find((item) => item.symbol === order.symbol);
    if (!position || position.direction === order.direction) {
      cancelled.set(order.id, 'reduce_only_no_position');
      continue;
    }

    const key = `${order.symbol}:${order.direction}`;
    const capacity = remainingCapacity.get(key) ?? position.quantity;
    if (order.remainingQuantity > capacity + Number.EPSILON) {
      cancelled.set(order.id, 'reduce_only_capacity_changed');
      continue;
    }
    remainingCapacity.set(key, Math.max(0, capacity - order.remainingQuantity));
  }

  if (cancelled.size === 0) return state;
  const entries: PaperLedgerEntry[] = [...cancelled].map(([orderId, reason]) => {
    const order = state.orders.find((item) => item.id === orderId);
    return {
      id: createId('ledger'),
      type: 'order_cancelled',
      symbol: order?.symbol ?? null,
      amount: 0,
      balanceAfter: state.walletBalance,
      description: reason,
      createdAt: timestamp,
    };
  });

  return {
    ...state,
    orders: state.orders.map((item) => {
      const reason = cancelled.get(item.id);
      return reason
        ? {
          ...item,
          status: 'cancelled' as const,
          remainingQuantity: 0,
          reservedMargin: 0,
          rejectReason: reason,
          updatedAt: timestamp,
        }
        : item;
    }),
    ledger: [...entries, ...state.ledger],
  };
};

export const fillOrder = ({ input, order, fillPrice, state }: FillOrderOptions): TradingSnapshot => {
  const timestamp = Date.now();
  const reduciblePosition = input.intent === 'close'
    ? state.positions.find((position) => (
      position.symbol === input.symbol && position.direction !== input.direction
    ))
    : null;
  const executableQuantity = input.intent === 'close'
    ? Math.min(input.quantity, reduciblePosition?.quantity ?? 0)
    : input.quantity;

  if (executableQuantity <= 0) {
    return {
      ...state,
      orders: state.orders.map((item) => item.id === order.id
        ? {
          ...item,
          status: 'cancelled' as const,
          remainingQuantity: 0,
          reservedMargin: 0,
          rejectReason: 'reduce_only_no_position',
          updatedAt: timestamp,
        }
        : item),
      ledger: [{
        id: createId('ledger'),
        type: 'order_cancelled',
        symbol: order.symbol,
        amount: 0,
        balanceAfter: state.walletBalance,
        description: 'reduce_only_no_position',
        createdAt: timestamp,
      }, ...state.ledger],
    };
  }

  const executableInput = { ...input, quantity: executableQuantity };
  const feeRate = (input.type === 'limit' && !input.isMarketableLimit) ? input.spec.makerFeeRate : input.spec.takerFeeRate;
  const fee = executableQuantity * fillPrice * feeRate;
  const positionUpdate = applyFillToPositions(
    state.positions,
    executableInput,
    fillPrice,
    fee,
    timestamp,
  );
  const walletBalance = state.walletBalance + positionUpdate.realizedPnl - fee;
  const filledOrder: PaperOrder = {
    ...order,
    status: 'filled',
    filledQuantity: order.filledQuantity + positionUpdate.executedQuantity,
    remainingQuantity: 0,
    averageFillPrice: fillPrice,
    reservedMargin: 0,
    fee,
    updatedAt: timestamp,
  };
  const fill: PaperFill = {
    id: createId('fill'),
    orderId: order.id,
    symbol: input.symbol,
    direction: input.direction,
    quantity: positionUpdate.executedQuantity,
    price: fillPrice,
    fee,
    createdAt: timestamp,
  };
  const ledger: PaperLedgerEntry[] = [{
    id: createId('ledger'),
    type: 'fee',
    symbol: input.symbol,
    amount: -fee,
    balanceAfter: walletBalance - positionUpdate.realizedPnl,
    description: `${input.intent} ${input.type} order fee`,
    createdAt: timestamp,
  }];
  if (positionUpdate.realizedPnl !== 0) {
    ledger.push({
      id: createId('ledger'),
      type: 'realized_pnl',
      symbol: input.symbol,
      amount: positionUpdate.realizedPnl,
      balanceAfter: walletBalance,
      description: 'Position realized PnL',
      createdAt: timestamp,
    });
  }

  const nextState: TradingSnapshot = {
    walletBalance,
    realizedPnl: state.realizedPnl + positionUpdate.realizedPnl,
    paidFees: state.paidFees + fee,
    orders: state.orders.map((item) => item.id === order.id ? filledOrder : item),
    fills: [fill, ...state.fills],
    positions: positionUpdate.positions,
    ledger: [...ledger.reverse(), ...state.ledger],
  };
  return reconcileReduceOnlyOrders(nextState, timestamp);
};
