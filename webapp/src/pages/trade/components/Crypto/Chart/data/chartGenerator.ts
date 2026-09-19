import type { OHLC, AreaData, ChartData, Timeframe } from '../types';
import type { Time } from 'lightweight-charts';

const getSeededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const generateMockChartData = (
  symbol: string, 
  currentPrice: number, 
  changePercent: number, 
  timeframe: Timeframe,
  numCandles: number = 200
): ChartData => {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let price = currentPrice || 50000;
  const rawCandles: OHLC[] = [];
  
  // We generate backwards from current time
  const timeframeSeconds: Record<Timeframe, number> = {
    '1s': 1,
    '1m': 60,
    '2m': 120,
    '3m': 180,
    '5m': 300,
    '15m': 900,
    '30m': 1_800,
    '1h': 3_600,
    '2h': 7_200,
    '4h': 14_400,
    '6h': 21_600,
    '8h': 28_800,
    '12h': 43_200,
    '1d': 86_400,
    '2d': 172_800,
    '3d': 259_200,
    '5d': 432_000,
    '1w': 604_800,
    '1M': 2_592_000,
    '3M': 7_776_000,
  };
  const intervalSeconds = timeframeSeconds[timeframe];
  const now = Math.floor((Date.now() / 1000) / intervalSeconds) * intervalSeconds;
  
  for (let i = 0; i < numCandles; i++) {
    const r1 = getSeededRandom(hash + i * 4);
    const r2 = getSeededRandom(hash + i * 4 + 1);
    const r3 = getSeededRandom(hash + i * 4 + 2);
    
    const trendBias = (changePercent / 100) * 0.1; 
    const volatility = price * 0.001 * Math.sqrt(intervalSeconds / 60);
    
    const close = price;
    const change = (r1 - 0.5 + trendBias) * volatility * 2;
    const open = close - change;
    
    const maxBody = Math.max(open, close);
    const minBody = Math.min(open, close);
    
    const high = maxBody + (r2 * volatility);
    const low = minBody - (r3 * volatility);
    
    // time should be in seconds (Unix timestamp)
    const time = (now - (i * intervalSeconds)) as Time;
    
    // unshift means the array will be sorted from oldest to newest (index 0 is oldest)
    rawCandles.unshift({ 
      open, 
      close, 
      high, 
      low, 
      time 
    });
    price = open;
  }
  
  const area: AreaData[] = rawCandles.map(c => ({
    time: c.time,
    value: c.close
  }));
  
  return { candles: rawCandles, area };
};
