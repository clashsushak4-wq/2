import type { TradePair } from '../types';

export const MOCK_PAIRS: TradePair[] = [
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', price: 78149.7, change: 0.99, volume: '1.5B', type: 'futures' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', price: 2365.62, change: 2.33, volume: '1.13B', type: 'futures' },
  { symbol: 'BSBUSDT', base: 'BSB', quote: 'USDT', price: 0.73287, change: 9.77, volume: '163.88M', type: 'futures' },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', price: 86.749, change: 1.13, volume: '138.19M', type: 'futures' },
  { symbol: 'ORCAUSDT', base: 'ORCA', quote: 'USDT', price: 1.389, change: 20.16, volume: '125.07M', type: 'futures', isNew: true },
  { symbol: 'XAUTUSDT', base: 'XAUT', quote: 'USDT', price: 4699.75, change: 0.20, volume: '104.72M', type: 'futures' },
  { symbol: 'RAVEUSDT', base: 'RAVE', quote: 'USDT', price: 0.94641, change: 10.70, volume: '70.74M', type: 'futures', isNew: true },
  { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT', price: 1.4296, change: 0.67, volume: '66.76M', type: 'futures' },
  { symbol: 'ZBTUSDT', base: 'ZBT', quote: 'USDT', price: 0.2456, change: 54.14, volume: '51.14M', type: 'futures', isNew: true },
  { symbol: 'TRUMPUSDT', base: 'TRUMP', quote: 'USDT', price: 2.617, change: 3.15, volume: '40.23M', type: 'futures' },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', price: 0.1823, change: -2.15, volume: '45.3M', type: 'futures' },
  { symbol: 'ADAUSDT', base: 'ADA', quote: 'USDT', price: 0.4521, change: 3.41, volume: '32.1M', type: 'futures' },
  { symbol: 'AVAXUSDT', base: 'AVAX', quote: 'USDT', price: 22.34, change: -0.82, volume: '28.7M', type: 'futures' },
  { symbol: 'LINKUSDT', base: 'LINK', quote: 'USDT', price: 14.89, change: 5.12, volume: '21.4M', type: 'futures' },
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', price: 78149.7, change: 0.99, volume: '1.5B', type: 'spot' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', price: 2365.62, change: 2.33, volume: '1.13B', type: 'spot' },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', price: 86.749, change: 1.13, volume: '138.19M', type: 'spot' },
  { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT', price: 1.4296, change: 0.67, volume: '66.76M', type: 'spot' },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', price: 0.1823, change: -2.15, volume: '45.3M', type: 'spot' },
];

export const parseVolume = (v: string) => {
  const num = parseFloat(v);
  if (v.endsWith('B')) return num * 1e9;
  if (v.endsWith('M')) return num * 1e6;
  return num;
};
