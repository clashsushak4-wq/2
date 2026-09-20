import type { Time } from 'lightweight-charts';

export type ChartType = 'candles' | 'area';
export type Timeframe = typeof import('../data/marketData').TIMEFRAMES[number];

export interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
  time: Time;
}

export interface AreaData {
  time: Time;
  value: number;
}

export interface ChartData {
  candles: OHLC[];
  area: AreaData[];
}
