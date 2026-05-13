import type { ChartCandle } from '../../../types';

export interface ChartStat {
  label: string;
  value: string;
}

export const MOCK_CHART_STATS: ChartStat[] = [
  { label: 'Макс. 24ч.', value: '2,382.19' },
  { label: 'Мин. 24ч', value: '2,302.88' },
  { label: 'Объем (USDT)', value: '2.25B' },
  { label: 'Объем за 24ч (ETH)', value: '965.4023K' },
];

export const MOCK_CANDLES: ChartCandle[] = [
  { time: 1, open: 3310, high: 3657, low: 3240, close: 3560, volume: 1.1 },
  { time: 2, open: 3560, high: 3618, low: 3125, close: 3195, volume: 1.7 },
  { time: 3, open: 3195, high: 3340, low: 2790, close: 2878, volume: 2.4 },
  { time: 4, open: 2878, high: 2980, low: 2412, close: 2550, volume: 1.8 },
  { time: 5, open: 2550, high: 2860, low: 2360, close: 2735, volume: 1.5 },
  { time: 6, open: 2735, high: 3040, low: 2620, close: 2968, volume: 1.2 },
  { time: 7, open: 2968, high: 3240, low: 2810, close: 3156, volume: 1.3 },
  { time: 8, open: 3156, high: 3480, low: 3060, close: 3338, volume: 1.9 },
  { time: 9, open: 3338, high: 3400, low: 2860, close: 2918, volume: 1.1 },
  { time: 10, open: 2918, high: 3120, low: 2770, close: 3045, volume: 0.9 },
  { time: 11, open: 3045, high: 3200, low: 2840, close: 2928, volume: 0.8 },
  { time: 12, open: 2928, high: 3102, low: 2760, close: 3010, volume: 0.7 },
  { time: 13, open: 3010, high: 3235, low: 2870, close: 3188, volume: 0.9 },
  { time: 14, open: 3188, high: 3438, low: 3120, close: 3372, volume: 1.0 },
  { time: 15, open: 3372, high: 3410, low: 3168, close: 3288, volume: 1.2 },
  { time: 16, open: 3288, high: 3340, low: 3070, close: 3124, volume: 1.4 },
  { time: 17, open: 3124, high: 3180, low: 2920, close: 3008, volume: 1.6 },
  { time: 18, open: 3008, high: 3100, low: 2860, close: 2933, volume: 1.5 },
  { time: 19, open: 2933, high: 3070, low: 2710, close: 2788, volume: 1.8 },
  { time: 20, open: 2788, high: 2860, low: 2165, close: 2242, volume: 2.3 },
  { time: 21, open: 2242, high: 2318, low: 1741, close: 1988, volume: 2.7 },
  { time: 22, open: 1988, high: 2190, low: 1880, close: 2104, volume: 2.1 },
];

export const TIMEFRAME_LABELS = ['1м', '15м', '1ч', '4ч', '1Д'];

export const INDICATOR_LABELS = ['MA', 'EMA', 'BOLL', 'SAR', 'AVL', 'Линии поддержки/сопротивления'];
