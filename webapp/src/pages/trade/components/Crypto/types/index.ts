export type ViewMode = 'terminal' | 'chart';
export type MarketTab = 'futures' | 'spot' | 'margin' | 'onchain' | 'bots';
export type FilterTab = 'all' | 'new' | 'favorites';
export type ChartTimeframe = '1m' | '15m' | '1h' | '4h' | '1d';
export type ChartInfoTab = 'quotes' | 'data' | 'square' | 'help' | 'copytrading';
export type ChartIndicator = 'MA' | 'EMA' | 'BOLL' | 'SAR' | 'AVL' | 'VOL' | 'MACD' | 'KD';
export type ChartBottomTab = 'orderBook' | 'depth' | 'trades';

export interface TradePair {
  symbol: string;
  base: string;
  quote: string;
  price: number;
  change: number;
  volume: string;
  type: 'futures' | 'spot';
  isNew?: boolean;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type OrderSide = 'long' | 'short';
export type OrderType = 'limit' | 'market';
export type MarginMode = 'isolated' | 'cross';
export type PositionTab = 'positions' | 'orders' | 'bots' | 'copytrading';
