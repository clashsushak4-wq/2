import { useEffect } from 'react';
import { toInstrumentSpec } from '../data/mockInstruments';
import { useCryptoStore } from '../store/useCryptoStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

export const runMockDataTick = () => {
  useCryptoStore.getState().tick();
  const instruments = useCryptoStore.getState().instruments;
  const prices = Object.fromEntries(
    Object.values(instruments).map((instrument) => [instrument.symbol, instrument.price]),
  );
  const specs = Object.fromEntries(
    Object.values(instruments).map((instrument) => [instrument.symbol, toInstrumentSpec(instrument)]),
  );
  usePaperTradingStore.getState().processMarketTick(prices, specs);
};

export const useMockDataEngine = () => {
  useEffect(() => {
    // Start global ticker for mock data
    const interval = setInterval(runMockDataTick, 1000);

    return () => clearInterval(interval);
  }, []);
};
