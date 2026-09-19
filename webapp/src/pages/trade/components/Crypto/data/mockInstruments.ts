export interface MockInstrument {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  priceDecimals: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  turnover24h: string;
  openInterest: string;
  isNew: boolean;
  isFavoriteByDefault: boolean;
  tagKey?: string;
  tickSize: number;
  quantityStep: number;
  minQuantity: number;
  minNotional: number;
  maxLeverage: number;
  maintenanceMarginRate: number;
  makerFeeRate: number;
  takerFeeRate: number;
  priceBandPercent: number;
}

type InstrumentSeed = Omit<
  MockInstrument,
  | 'tickSize'
  | 'quantityStep'
  | 'minQuantity'
  | 'minNotional'
  | 'maxLeverage'
  | 'maintenanceMarginRate'
  | 'makerFeeRate'
  | 'takerFeeRate'
  | 'priceBandPercent'
>;

const INSTRUMENT_SEEDS: InstrumentSeed[] = [
  {
    symbol: 'BTCUSDT',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    price: 76941.7,
    priceDecimals: 1,
    changePercent: 0.69,
    high24h: 77134.9,
    low24h: 75985.2,
    volume24h: '23.89K',
    turnover24h: '1.83B',
    openInterest: '1.28B',
    isNew: false,
    isFavoriteByDefault: true,
  },
  {
    symbol: 'ETHUSDT',
    baseAsset: 'ETH',
    quoteAsset: 'USDT',
    price: 2456.64,
    priceDecimals: 2,
    changePercent: 1.67,
    high24h: 2498.31,
    low24h: 2398.42,
    volume24h: '412.71K',
    turnover24h: '1.63B',
    openInterest: '811.26M',
    isNew: false,
    isFavoriteByDefault: false,
  },
  {
    symbol: 'ZECUSDT',
    baseAsset: 'ZEC',
    quoteAsset: 'USDT',
    price: 1488.14,
    priceDecimals: 2,
    changePercent: 9.32,
    high24h: 1512.3,
    low24h: 1348.91,
    volume24h: '318.44K',
    turnover24h: '467.82M',
    openInterest: '96.14M',
    isNew: false,
    isFavoriteByDefault: true,
  },
  {
    symbol: 'SOLUSDT',
    baseAsset: 'SOL',
    quoteAsset: 'USDT',
    price: 102.347,
    priceDecimals: 3,
    changePercent: 3.52,
    high24h: 104.821,
    low24h: 98.406,
    volume24h: '1.88M',
    turnover24h: '192M',
    openInterest: '144.91M',
    isNew: false,
    isFavoriteByDefault: false,
  },
  {
    symbol: 'XRPUSDT',
    baseAsset: 'XRP',
    quoteAsset: 'USDT',
    price: 1.3036,
    priceDecimals: 4,
    changePercent: 0.75,
    high24h: 1.3214,
    low24h: 1.2761,
    volume24h: '111.65M',
    turnover24h: '146.03M',
    openInterest: '86.38M',
    isNew: false,
    isFavoriteByDefault: true,
  },
  {
    symbol: 'XAUUSDT',
    baseAsset: 'XAU',
    quoteAsset: 'USDT',
    price: 4357.24,
    priceDecimals: 2,
    changePercent: 1.37,
    high24h: 4381.06,
    low24h: 4288.73,
    volume24h: '29.41K',
    turnover24h: '128.51M',
    openInterest: '61.73M',
    isNew: false,
    isFavoriteByDefault: false,
    tagKey: 'trade.tradFiMetals',
  },
  {
    symbol: 'HYPEUSDT',
    baseAsset: 'HYPE',
    quoteAsset: 'USDT',
    price: 86.494,
    priceDecimals: 3,
    changePercent: 9.97,
    high24h: 88.152,
    low24h: 77.809,
    volume24h: '1.11M',
    turnover24h: '95.94M',
    openInterest: '72.16M',
    isNew: false,
    isFavoriteByDefault: false,
  },
  {
    symbol: 'SNDKUSDT',
    baseAsset: 'SNDK',
    quoteAsset: 'USDT',
    price: 1611.67,
    priceDecimals: 2,
    changePercent: 5.19,
    high24h: 1640.82,
    low24h: 1519.24,
    volume24h: '57.81K',
    turnover24h: '92.93M',
    openInterest: '41.75M',
    isNew: true,
    isFavoriteByDefault: false,
    tagKey: 'trade.tradFiStock',
  },
  {
    symbol: 'SOXLUSDT',
    baseAsset: 'SOXL',
    quoteAsset: 'USDT',
    price: 113.16,
    priceDecimals: 2,
    changePercent: 6.51,
    high24h: 115.38,
    low24h: 105.42,
    volume24h: '733.39K',
    turnover24h: '82.99M',
    openInterest: '38.44M',
    isNew: true,
    isFavoriteByDefault: false,
    tagKey: 'trade.tradFiEtf',
  },
  {
    symbol: 'SPCXUSDT',
    baseAsset: 'SPCX',
    quoteAsset: 'USDT',
    price: 154.84,
    priceDecimals: 2,
    changePercent: 1.63,
    high24h: 157.22,
    low24h: 150.91,
    volume24h: '502.76K',
    turnover24h: '77.85M',
    openInterest: '33.12M',
    isNew: true,
    isFavoriteByDefault: false,
    tagKey: 'trade.tradFiStock',
  },
];

const getQuantityStep = (price: number): number => {
  if (price >= 10_000) return 0.001;
  if (price >= 1_000) return 0.01;
  if (price >= 10) return 0.1;
  return 1;
};

export const MOCK_INSTRUMENTS: MockInstrument[] = INSTRUMENT_SEEDS.map((instrument) => {
  const quantityStep = getQuantityStep(instrument.price);
  return {
    ...instrument,
    tickSize: 10 ** -instrument.priceDecimals,
    quantityStep,
    minQuantity: quantityStep,
    minNotional: 5,
    maxLeverage: instrument.symbol === 'BTCUSDT' ? 125 : 100,
    maintenanceMarginRate: 0.005,
    makerFeeRate: 0.0002,
    takerFeeRate: 0.0004,
    priceBandPercent: 0.1,
  };
});

export const DEFAULT_INSTRUMENT = MOCK_INSTRUMENTS[0];

export const DEFAULT_FAVORITE_SYMBOLS = MOCK_INSTRUMENTS
  .filter((instrument) => instrument.isFavoriteByDefault)
  .map((instrument) => instrument.symbol);

export const getMockInstrument = (symbol: string): MockInstrument => (
  MOCK_INSTRUMENTS.find((instrument) => instrument.symbol === symbol) ?? DEFAULT_INSTRUMENT
);

export const toInputPrice = (instrument: MockInstrument): string => (
  instrument.price.toFixed(instrument.priceDecimals)
);

export const formatInstrumentPrice = (
  instrument: MockInstrument,
  value = instrument.price,
): string => value.toLocaleString('en-US', {
  minimumFractionDigits: instrument.priceDecimals,
  maximumFractionDigits: instrument.priceDecimals,
});

export const formatSignedPercent = (value: number): string => (
  `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
);

export const formatApproximateFiat = (instrument: MockInstrument): string => {
  const value = instrument.price * 44.64;
  return `₴${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const toInstrumentSpec = (instrument: MockInstrument): InstrumentSpec => ({
  symbol: instrument.symbol,
  baseAsset: instrument.baseAsset,
  quoteAsset: instrument.quoteAsset,
  marginAsset: instrument.quoteAsset,
  tickSize: instrument.tickSize,
  quantityStep: instrument.quantityStep,
  minQuantity: instrument.minQuantity,
  minNotional: instrument.minNotional,
  maxLeverage: instrument.maxLeverage,
  maintenanceMarginRate: instrument.maintenanceMarginRate,
  makerFeeRate: instrument.makerFeeRate,
  takerFeeRate: instrument.takerFeeRate,
  priceBandPercent: instrument.priceBandPercent,
});
import type { InstrumentSpec } from '../domain/types';
