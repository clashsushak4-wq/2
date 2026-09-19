import { useEffect } from 'react';
import { DEFAULT_FAVORITE_SYMBOLS, DEFAULT_INSTRUMENT } from '../data/mockInstruments';
import { useCryptoStore } from '../store/useCryptoStore';
import { usePaperTradingStore } from '../store/usePaperTradingStore';

const STORAGE_KEY = 'crypto_terminal_demo_v1';

interface PersistedDemoState {
  version: 1;
  ui: {
    favoriteSymbols: string[];
    leverage: number;
    marginMode: 'cross' | 'isolated';
    unit: 'qty_base' | 'cost_quote' | 'value_quote';
  };
  trading: {
    walletBalance: number;
    realizedPnl: number;
    paidFees: number;
    orders: ReturnType<typeof usePaperTradingStore.getState>['orders'];
    fills: ReturnType<typeof usePaperTradingStore.getState>['fills'];
    positions: ReturnType<typeof usePaperTradingStore.getState>['positions'];
    ledger: ReturnType<typeof usePaperTradingStore.getState>['ledger'];
  };
}

const readPersistedState = (): PersistedDemoState | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedDemoState>;
    if (parsed.version !== 1 || !parsed.ui || !parsed.trading) return null;
    if (!Number.isFinite(parsed.trading.walletBalance) || parsed.trading.walletBalance! < 0) return null;
    if (
      !Array.isArray(parsed.trading.orders)
      || !Array.isArray(parsed.trading.fills)
      || !Array.isArray(parsed.trading.positions)
      || !Array.isArray(parsed.trading.ledger)
    ) return null;
    return parsed as PersistedDemoState;
  } catch {
    return null;
  }
};

const createPersistedState = (): PersistedDemoState => {
  const ui = useCryptoStore.getState();
  const trading = usePaperTradingStore.getState();
  return {
    version: 1,
    ui: {
      favoriteSymbols: ui.favoriteSymbols,
      leverage: ui.leverage,
      marginMode: ui.marginMode,
      unit: ui.unit,
    },
    trading: {
      walletBalance: trading.walletBalance,
      realizedPnl: trading.realizedPnl,
      paidFees: trading.paidFees,
      orders: trading.orders,
      fills: trading.fills,
      positions: trading.positions,
      ledger: trading.ledger,
    },
  };
};

export const useDemoPersistence = () => {
  useEffect(() => {
    const persisted = readPersistedState();
    if (persisted) {
      useCryptoStore.setState({
        favoriteSymbols: Array.isArray(persisted.ui.favoriteSymbols)
          ? persisted.ui.favoriteSymbols
          : DEFAULT_FAVORITE_SYMBOLS,
        leverage: Number.isFinite(persisted.ui.leverage)
          ? Math.max(1, Math.min(DEFAULT_INSTRUMENT.maxLeverage, persisted.ui.leverage))
          : 3,
        marginMode: 'isolated',
        unit: ['qty_base', 'cost_quote', 'value_quote'].includes(persisted.ui.unit)
          ? persisted.ui.unit
          : 'value_quote',
      });
      usePaperTradingStore.setState(persisted.trading);
    }

    let timer: ReturnType<typeof window.setTimeout> | null = null;
    const scheduleSave = () => {
      if (timer !== null) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedState()));
        } catch {
          // The template keeps running even when storage is unavailable.
        }
        timer = null;
      }, 150);
    };
    const unsubscribeUi = useCryptoStore.subscribe(scheduleSave);
    const unsubscribeTrading = usePaperTradingStore.subscribe(scheduleSave);

    const flushSave = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(createPersistedState()));
        } catch {
          // ignore
        }
      }
    };

    const handleUnload = () => flushSave();
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      unsubscribeUi();
      unsubscribeTrading();
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      flushSave();
    };
  }, []);
};
