import { useState, useEffect, useRef } from 'react';

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws';

export interface BinanceTicker {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

export const useBinanceTicker = (symbol: string) => {
  const [ticker, setTicker] = useState<BinanceTicker | null>(null);

  useEffect(() => {
    if (!symbol) return;
    const wsSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`${BINANCE_WS_URL}/${wsSymbol}@ticker`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.e === '24hrTicker') {
        setTicker({
          lastPrice: data.c,
          priceChangePercent: data.P,
          highPrice: data.h,
          lowPrice: data.l,
          volume: data.v,
          quoteVolume: data.q,
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  return ticker;
};

export interface OrderBookEntry {
  price: number;
  quantity: number;
}

export interface BinanceOrderBook {
  lastUpdateId: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export const useBinanceOrderBook = (symbol: string) => {
  const [orderBook, setOrderBook] = useState<BinanceOrderBook | null>(null);

  useEffect(() => {
    if (!symbol) return;
    const wsSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`${BINANCE_WS_URL}/${wsSymbol}@depth20@100ms`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.b && data.a) {
        setOrderBook({
          lastUpdateId: data.lastUpdateId,
          bids: data.b.map((item: string[]) => ({ price: parseFloat(item[0]), quantity: parseFloat(item[1]) })),
          // Asks come sorted lowest to highest. We might need them reversed in the UI, but we'll store them as-is.
          asks: data.a.map((item: string[]) => ({ price: parseFloat(item[0]), quantity: parseFloat(item[1]) })),
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [symbol]);

  return orderBook;
};

export interface BinanceKline {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export const useBinanceKline = (symbol: string, interval: string) => {
  const [kline, setKline] = useState<BinanceKline | null>(null);

  useEffect(() => {
    if (!symbol || !interval) return;
    const wsSymbol = symbol.toLowerCase();
    const ws = new WebSocket(`${BINANCE_WS_URL}/${wsSymbol}@kline_${interval}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.e === 'kline' && data.k) {
        setKline({
          time: data.k.t / 1000, // Unix timestamp in seconds for lightweight-charts
          open: parseFloat(data.k.o),
          high: parseFloat(data.k.h),
          low: parseFloat(data.k.l),
          close: parseFloat(data.k.c),
          volume: parseFloat(data.k.v),
          isClosed: data.k.x,
        });
      }
    };

    return () => {
      ws.close();
    };
  }, [symbol, interval]);

  return kline;
};
