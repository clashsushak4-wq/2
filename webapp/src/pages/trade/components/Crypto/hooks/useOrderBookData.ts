import { useMemo } from 'react';
import { formatVolume } from '../data/marketData';
import { useInstrument, useCryptoStore } from '../store/useCryptoStore';
import { useMarketStore } from '../store/useMarketStore';

export interface OrderBookRowData {
  price: string; amount: string; rawPrice: number; rawAmount: number;
}

export function aggregateOrders(levels: [number, number][], step: number, direction: 'ask' | 'bid', decimals: number): OrderBookRowData[] {
  const result = new Map<number, number>();
  for (const [price, amount] of levels) {
    const quotient = price / step;
    const nearest = Math.round(quotient);
    const units = Math.abs(quotient - nearest) < 1e-8 ? nearest : direction === 'ask' ? Math.ceil(quotient) : Math.floor(quotient);
    const groupedPrice = Number((units * step).toFixed(decimals));
    result.set(groupedPrice, (result.get(groupedPrice) ?? 0) + amount);
  }
  return [...result.entries()].sort(([a], [b]) => direction === 'ask' ? a - b : b - a).map(([price, amount]) => ({
    rawPrice: price, rawAmount: amount,
    price: price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
    amount: formatVolume(amount),
  }));
}

export const useOrderBookData = () => {
  const selected = useCryptoStore(state => state.selectedSymbol);
  const stored = useCryptoStore(state => state.tickSize);
  const instrument = useInstrument(selected);
  const book = useMarketStore(state => state.books[selected]);
  const availablePrecisions = useMemo(() => [1, 5, 10, 50, 100].map(multiplier =>
    Number((instrument.tickSize * multiplier).toFixed(instrument.priceDecimals))), [instrument.tickSize, instrument.priceDecimals]);
  const activeTickSize = stored !== null && availablePrecisions.includes(stored) ? stored : instrument.tickSize;
  const result = useMemo(() => ({
    asks: aggregateOrders(book?.asks ?? [], activeTickSize, 'ask', instrument.priceDecimals),
    bids: aggregateOrders(book?.bids ?? [], activeTickSize, 'bid', instrument.priceDecimals),
  }), [book, activeTickSize, instrument.priceDecimals]);
  return { instrument, ...result, availablePrecisions, activeTickSize, book };
};
