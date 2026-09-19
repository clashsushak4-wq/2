import { useMemo } from 'react';
import type { MockInstrument } from '../data/mockInstruments.ts';
import { useInstrument, useCryptoStore } from '../store/useCryptoStore';

export interface OrderBookRowData {
  price: string;
  amount: string;
  rawPrice: number;
  rawAmount: number;
}

const generatePrecisionOptions = (decimals: number): number[] => {
  const base = 10 ** -decimals;
  if (decimals <= 1) return [base, 1, 10, 50, 100]; // e.g. BTC
  if (decimals === 2) return [base, 0.1, 1, 10, 50]; // e.g. ETH
  if (decimals === 3) return [base, 0.01, 0.1, 1, 10]; 
  return [base, base * 10, base * 100, base * 1000]; // e.g. XRP
};

// Генерирует 200 уровней сырого стакана для эмуляции реальной ликвидности
const generateRawOrders = (
  instrument: MockInstrument,
  direction: 'ask' | 'bid',
  tickCounter: number,
  selectedTickSize: number,
) => {
  const step = Math.max(instrument.tickSize, selectedTickSize / 4);
  const seed = Array.from(instrument.symbol).reduce((total, char) => total + char.charCodeAt(0), 0);
  const count = 200;

  return Array.from({ length: count }, (_, index) => {
    // Для bids цены идут вниз, для asks - вверх
    const level = index + 1;
    const price = instrument.price + (direction === 'ask' ? step * level : -step * level);
    // Чем дальше от текущей цены, тем больше объем (имитация стен)
    const amount = ((seed % 37 + 18) * (index + 1) * 1.5) / 10;
    const jitter = 0.8 + (((tickCounter * 3) + index) % 5) * 0.1;
    return {
      price: Math.max(0, price),
      amount: amount * jitter,
    };
  });
};

const aggregateOrders = (
  rawOrders: { price: number; amount: number }[],
  tickSize: number,
  direction: 'ask' | 'bid'
): OrderBookRowData[] => {
  const aggregated = new Map<number, number>();

  for (const order of rawOrders) {
    if (order.price <= 0) continue;
    
    // Asks группируются ВВЕРХ (ceil), Bids группируются ВНИЗ (floor)
    // чтобы не перекрывать спред
    const roundedPrice = direction === 'ask'
      ? Math.ceil(order.price / tickSize) * tickSize
      : Math.floor(order.price / tickSize) * tickSize;

    // Решаем проблему float precision в JS
    const cleanPrice = Number(roundedPrice.toFixed(10));

    const existingAmount = aggregated.get(cleanPrice) || 0;
    aggregated.set(cleanPrice, existingAmount + order.amount);
  }

  // Конвертируем обратно в массив и сортируем
  const sortedPrices = Array.from(aggregated.keys()).sort((a, b) => 
    direction === 'ask' ? a - b : b - a
  );

  return sortedPrices.map(price => {
    const rawAmount = aggregated.get(price)!;
    return {
      rawPrice: price,
      rawAmount: rawAmount,
      price: formatTickPrice(price, tickSize),
      amount: `${rawAmount.toFixed(2)}K`,
    };
  });
};

const formatTickPrice = (price: number, tickSize: number) => {
  if (tickSize >= 1) return price.toFixed(0);
  const decimalsStr = tickSize.toString().split('.')[1];
  const decimals = decimalsStr ? decimalsStr.length : 0;
  
  // Добавляем commas для тысяч
  const parts = price.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join('.');
};

export const useOrderBookData = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const storedTickSize = useCryptoStore(state => state.tickSize);
  const tickCounter = useCryptoStore(state => state.tickCounter);
  
  const instrument = useInstrument(selectedSymbol);
  
  const availablePrecisions = useMemo(
    () => generatePrecisionOptions(instrument.priceDecimals),
    [instrument.priceDecimals]
  );

  const activeTickSize = storedTickSize !== null ? storedTickSize : availablePrecisions[0];

  const { asks, bids } = useMemo(() => {
    const rawAsks = generateRawOrders(instrument, 'ask', tickCounter, activeTickSize);
    const rawBids = generateRawOrders(instrument, 'bid', tickCounter, activeTickSize);

    const aggregatedAsks = aggregateOrders(rawAsks, activeTickSize, 'ask');
    const aggregatedBids = aggregateOrders(rawBids, activeTickSize, 'bid');

    // Для asks нужно реверснуть массив, так как в стакане они рендерятся снизу вверх (ближайшие к текущей цене - внизу)
    // aggregateOrders возвращает asks от меньшего к большему.
    // Нам нужно отобразить например 7 строк. Ближайшие 7: [0..6]. Но рендерить их надо от большего к меньшему, чтобы лучшая цена была внизу.
    return {
      asks: aggregatedAsks,
      bids: aggregatedBids,
    };
  }, [instrument, activeTickSize, tickCounter]);

  return {
    instrument,
    asks,
    bids,
    availablePrecisions,
    activeTickSize,
  };
};
