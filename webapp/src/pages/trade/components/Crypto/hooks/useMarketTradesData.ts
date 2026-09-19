import { useState, useEffect } from 'react';
import { formatInstrumentPrice, MockInstrument } from '../data/mockInstruments.ts';
import { useInstrument, useCryptoStore } from '../store/useCryptoStore';

export interface MarketTrade {
  id: string;
  price: string;
  amount: string;
  time: string;
  direction: 'buy' | 'sell';
  isNew?: boolean;
}

const generateMockTrades = (instrument: MockInstrument): MarketTrade[] => {
  const step = 10 ** -instrument.priceDecimals;
  const trades: MarketTrade[] = [];
  const now = new Date();

  let seed = Array.from(instrument.symbol).reduce((total, char) => total + char.charCodeAt(0), 0);
  let currentPrice = instrument.price;

  for (let i = 0; i < 50; i++) {
    seed = (seed * 16807) % 2147483647;
    const direction = seed % 2 === 0 ? 'buy' : 'sell';
    
    seed = (seed * 16807) % 2147483647;
    const ticks = (seed % 5);
    currentPrice = currentPrice + (direction === 'buy' ? step * ticks : -step * ticks);
    if (currentPrice <= 0) currentPrice = instrument.price;

    seed = (seed * 16807) % 2147483647;
    const amount = ((seed % 100 + 1) * 0.1).toFixed(3);

    const time = new Date(now.getTime() - i * 15000); 
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}`;

    trades.push({
      id: `${instrument.symbol}-trade-${i}`,
      price: formatInstrumentPrice(instrument, currentPrice),
      amount: amount,
      time: timeStr,
      direction,
      isNew: false,
    });
  }

  return trades;
};

export const useMarketTradesData = () => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  const tickCounter = useCryptoStore(state => state.tickCounter);
  const instrument = useInstrument(selectedSymbol);
  
  const [trades, setTrades] = useState<MarketTrade[]>([]);

  // Инициализация при смене символа
  useEffect(() => {
    setTrades(generateMockTrades(instrument));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol]);

  // Добавление новых сделок при тиках
  useEffect(() => {
    if (trades.length === 0) return;
    if (Math.random() > 0.4) return; // Не каждый тик порождает сделку

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const direction = Math.random() > 0.5 ? 'buy' : 'sell';
    const amount = (Math.random() * 5 + 0.1).toFixed(3);

    const newTrade: MarketTrade = {
      id: `${selectedSymbol}-trade-${Date.now()}`,
      price: formatInstrumentPrice(instrument, instrument.price),
      amount,
      time: timeStr,
      direction,
      isNew: true,
    };

    setTrades(prev => {
      // Снимаем флаг isNew со старых
      const next = prev.map(t => t.isNew ? { ...t, isNew: false } : t);
      return [newTrade, ...next].slice(0, 50);
    });
  }, [tickCounter]);

  return {
    instrument,
    trades,
  };
};
