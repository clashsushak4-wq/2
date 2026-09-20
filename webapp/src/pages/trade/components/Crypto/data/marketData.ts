import type { InstrumentSpec } from '../domain/types';

export interface RiskTier {
  limit: number;
  maintenanceMarginRate: number;
  maintenanceMarginDeduction: number;
  maxLeverage: number;
}
export interface MarketInstrument {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  marginAsset: string;
  price: number | null;
  markPrice: number | null;
  indexPrice: number | null;
  priceDecimals: number;
  changePercent: number | null;
  high24h: number | null;
  low24h: number | null;
  volume24h: number | null;
  turnover24h: number | null;
  openInterest: number | null;
  fundingRate: number | null;
  nextFundingTime: number | null;
  bidPrice: number | null;
  askPrice: number | null;
  isNew: boolean;
  tickSize: number;
  quantityStep: number;
  minQuantity: number;
  minNotional: number;
  maxQuantity: number;
  maxMarketQuantity: number;
  maxLeverage: number;
  leverageStep: number;
  makerFeeRate: number | null;
  takerFeeRate: number | null;
  buyLimit: number | null;
  sellLimit: number | null;
  riskTiers: RiskTier[];
  tradingReady: boolean;
  rulesError: string | null;
  rulesUpdatedAt: number | null;
  updatedAt: number | null;
  receivedAt: number | null;
}
export type PricedInstrument = MarketInstrument & { price: number };
export interface MarketSource {
  id: number; name: string; key: string; environment: 'mainnet' | 'testnet';
  quote: string; category: string; initialBalance: number; execution: 'server_demo';
}
export interface MarketBook {
  symbol: string; bids: [number, number][]; asks: [number, number][];
  updateId: number; updatedAt: number; receivedAt: number;
}
export interface MarketTrade {
  id: string; symbol: string; price: number; amount: number;
  time: number; direction: 'buy' | 'sell';
}
export interface MarketCandle {
  time: number; open: number; high: number; low: number; close: number; volume: number; confirmed?: boolean;
}
export const TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '12h', '1d', '1w', '1M'] as const;

export const toInputPrice = (instrument: MarketInstrument): string =>
  instrument.price === null ? '' : instrument.price.toFixed(instrument.priceDecimals);

export const formatWithSpaces = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';
  const str = String(value);
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.');
};

export const formatInstrumentPrice = (instrument: Pick<MarketInstrument, 'price' | 'priceDecimals'>, value = instrument.price): string =>
  value === null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US', {
    minimumFractionDigits: instrument.priceDecimals, maximumFractionDigits: instrument.priceDecimals,
  });

export const formatSignedPercent = (value: number | null): string =>
  value === null || !Number.isFinite(value) ? '—' : (value >= 0 ? '+' : '') + value.toFixed(2) + '%';

export const formatVolume = (value: number | null): string =>
  value === null || !Number.isFinite(value) ? '—' : new Intl.NumberFormat('en-US', {
    notation: 'compact', maximumFractionDigits: 2,
  }).format(value);

export const toInstrumentSpec = (instrument: MarketInstrument): InstrumentSpec => ({
  symbol: instrument.symbol, baseAsset: instrument.baseAsset, quoteAsset: instrument.quoteAsset,
  marginAsset: instrument.marginAsset, tickSize: instrument.tickSize, quantityStep: instrument.quantityStep,
  minQuantity: instrument.minQuantity, minNotional: instrument.minNotional, maxLeverage: instrument.maxLeverage,
  maintenanceMarginRate: instrument.riskTiers[0]?.maintenanceMarginRate ?? NaN,
  makerFeeRate: instrument.makerFeeRate ?? NaN, takerFeeRate: instrument.takerFeeRate ?? NaN,
  buyLimit: instrument.buyLimit, sellLimit: instrument.sellLimit,
});
