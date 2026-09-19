import type { Time } from 'lightweight-charts';

export type ChartType = 'candles' | 'area';
export type Timeframe = '1s' | '1m' | '2m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '2d' | '3d' | '5d' | '1w' | '1M' | '3M';

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
