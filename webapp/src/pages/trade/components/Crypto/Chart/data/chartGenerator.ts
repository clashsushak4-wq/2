import { OHLC, AreaData, ChartData } from '../types';
import { Time } from 'lightweight-charts';

const getSeededRandom = (seed: number) => {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

export const generateMockChartData = (
  symbol: string, 
  currentPrice: number, 
  changePercent: number, 
  numCandles: number = 200
): ChartData => {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let price = currentPrice || 50000;
  const rawCandles: OHLC[] = [];
  
  // We generate backwards from current time
  const now = Math.floor(Date.now() / 1000);
  
  for (let i = 0; i < numCandles; i++) {
    const r1 = getSeededRandom(hash + i * 4);
    const r2 = getSeededRandom(hash + i * 4 + 1);
    const r3 = getSeededRandom(hash + i * 4 + 2);
    
    const trendBias = (changePercent / 100) * 0.1; 
    const volatility = price * 0.003;
    
    const close = price;
    const change = (r1 - 0.5 - trendBias) * volatility * 2;
    const open = close - change;
    
    const maxBody = Math.max(open, close);
    const minBody = Math.min(open, close);
    
    const high = maxBody + (r2 * volatility);
    const low = minBody - (r3 * volatility);
    
    // time should be in seconds (Unix timestamp)
    const time = (now - (i * 60)) as Time;
    
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
