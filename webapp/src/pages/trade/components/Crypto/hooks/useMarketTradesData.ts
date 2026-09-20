import { useMemo } from 'react';
import { formatInstrumentPrice, formatVolume } from '../data/marketData';
import { useInstrument, useCryptoStore } from '../store/useCryptoStore';
import { useMarketStore } from '../store/useMarketStore';

export const useMarketTradesData = () => {
  const symbol = useCryptoStore(state => state.selectedSymbol);
  const instrument = useInstrument(symbol);
  const rows = useMarketStore(state => state.trades[symbol]);
  const trades = useMemo(() => (rows ?? []).map(row => ({
    id: row.id, price: formatInstrumentPrice(instrument, row.price), amount: formatVolume(row.amount),
    time: new Date(row.time).toLocaleTimeString('en-GB', { hour12: false }),
    direction: row.direction, isNew: false,
  })), [rows, instrument.priceDecimals]);
  return { instrument, trades };
};
