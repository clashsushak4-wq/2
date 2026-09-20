export type TradeDirection = 'long' | 'short';
export type OrderIntent = 'open' | 'close';
export type OrderType = 'limit' | 'market';
export type MarginMode = 'cross' | 'isolated';
export type UnitType = 'qty_base' | 'cost_quote' | 'value_quote';
export type TPSLMode = 'price' | 'roi' | 'change' | 'pnl';

export type OrderStatus =
  | 'pending'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'rejected'
  | 'liquidated';

export interface InstrumentSpec {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  marginAsset: string;
  tickSize: number;
  quantityStep: number;
  minQuantity: number;
  minNotional: number;
  maxLeverage: number;
  maintenanceMarginRate: number;
  makerFeeRate: number;
  takerFeeRate: number;
  buyLimit: number | null;
  sellLimit: number | null;
}

export interface AttachedTPSL {
  takeProfitPrice: number | null;
  stopLossPrice: number | null;
}

export interface PaperOrder {
  id: string;
  clientOrderId: string;
  symbol: string;
  direction: TradeDirection;
  intent: OrderIntent;
  reduceOnly: boolean;
  type: OrderType;
  status: OrderStatus;
  quantity: number;
  filledQuantity: number;
  remainingQuantity: number;
  requestedPrice: number | null;
  averageFillPrice: number | null;
  leverage: number;
  marginMode: MarginMode;
  reservedMargin: number;
  fee: number;
  tpsl: AttachedTPSL;
  rejectReason: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PaperFill {
  id: string;
  orderId: string;
  symbol: string;
  direction: TradeDirection;
  quantity: number;
  price: number;
  fee: number;
  createdAt: number;
}

import type { MarketInstrument } from '../data/marketData';

export interface PaperPosition {
  spec: MarketInstrument;
  id: string;
  symbol: string;
  direction: TradeDirection;
  quantity: number;
  averageEntryPrice: number;
  markPrice: number;
  leverage: number;
  marginMode: MarginMode;
  initialMargin: number;
  maintenanceMargin: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  accumulatedFees: number;
  tpsl: AttachedTPSL;
  openedAt: number;
  updatedAt: number;
}

export type LedgerEntryType =
  | 'funding'
  | 'fee'
  | 'realized_pnl'
  | 'order_cancelled'
  | 'liquidation'
  | 'reset';

export interface PaperLedgerEntry {
  id: string;
  type: LedgerEntryType;
  symbol: string | null;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: number;
}

export interface PaperAccount {
  fundingPaid: number;
  startingBalance: number;
  walletBalance: number;
  reservedMargin: number;
  positionMargin: number;
  unrealizedPnl: number;
  realizedPnl: number;
  paidFees: number;
  equity: number;
  availableBalance: number;
}

export interface PlacePaperOrderInput {
  clientOrderId: string;
  symbol: string;
  direction: TradeDirection;
  intent: OrderIntent;
  type: OrderType;
  quantity: number;
  limitPrice: number | null;
  marketPrice: number;
  leverage: number;
  marginMode: MarginMode;
  tpsl: AttachedTPSL;
  spec: InstrumentSpec;
  isMarketableLimit?: boolean;
}

export type TradingActionCode = string
  | 'order_cancelled'
  | 'orders_cancelled'
  | 'order_not_found'
  | 'order_not_open'
  | 'no_open_orders'
  | 'position_closed'
  | 'position_partially_closed'
  | 'position_not_found'
  | 'close_quantity_invalid'
  | 'close_failed'
  | 'tpsl_invalid'
  | 'tpsl_updated';

export interface TradingActionResult {
  ok: boolean;
  code: TradingActionCode;
  affectedCount: number;
  orderId?: string;
  positionId?: string;
  quantity?: number;
}
