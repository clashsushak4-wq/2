import { create } from 'zustand';
import {
  DEFAULT_FAVORITE_SYMBOLS,
  DEFAULT_INSTRUMENT,
  toInputPrice,
  MockInstrument,
  MOCK_INSTRUMENTS,
} from '../data/mockInstruments.ts';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type UnitType = 'qty_base' | 'cost_quote' | 'value_quote';
export type TabType = 'orders' | 'positions' | 'screener' | 'history';
export type MarginMode = 'cross' | 'isolated';
export type OrderBookMode = 'split' | 'bids' | 'asks';

interface CryptoState {
  availableBalance: number;
  amountPercent: number;
  isTPSL: boolean;
  side: OrderSide;
  orderType: OrderType;
  price: string;
  leverage: number;
  isBatchLeverage: boolean;
  unit: UnitType;
  activeTab: TabType;
  marginMode: MarginMode;
  selectedSymbol: string;
  favoriteSymbols: string[];
  tickSize: number | null;
  orderBookMode: OrderBookMode;
  instruments: Record<string, MockInstrument>;
  tickCounter: number;
  toastMessage: string | null;
  toastType: 'success' | 'error' | null;

  isOrderTypeOpen: boolean;
  isLeverageOpen: boolean;
  isUnitOpen: boolean;
  isMarginModeOpen: boolean;
  isSymbolSelectOpen: boolean;
  isChartOpen: boolean;
  isOrderBookCardOpen: boolean;
  isTickSizeOpen: boolean;

  setAvailableBalance: (val: number) => void;
  setAmountPercent: (val: number) => void;
  setIsTPSL: (val: boolean) => void;
  setSide: (val: OrderSide) => void;
  setOrderType: (val: OrderType) => void;
  setPrice: (val: string) => void;
  setLeverage: (val: number) => void;
  setIsBatchLeverage: (val: boolean) => void;
  setUnit: (val: UnitType) => void;
  setActiveTab: (val: TabType) => void;
  setMarginMode: (val: MarginMode) => void;
  setSelectedSymbol: (symbol: string) => void;
  toggleFavoriteSymbol: (symbol: string) => void;

  setOrderTypeOpen: (isOpen: boolean) => void;
  setLeverageOpen: (isOpen: boolean) => void;
  setUnitOpen: (isOpen: boolean) => void;
  setMarginModeOpen: (isOpen: boolean) => void;
  setSymbolSelectOpen: (isOpen: boolean) => void;
  setChartOpen: (isOpen: boolean) => void;
  setOrderBookCardOpen: (isOpen: boolean) => void;
  setTickSizeOpen: (isOpen: boolean) => void;
  setTickSize: (val: number | null) => void;
  setOrderBookMode: (mode: OrderBookMode) => void;
  cycleOrderBookMode: () => void;
  tpMode: 'price' | 'roi' | 'change' | 'pnl';
  slMode: 'price' | 'roi' | 'change' | 'pnl';
  setTpMode: (mode: 'price' | 'roi' | 'change' | 'pnl') => void;
  setSlMode: (mode: 'price' | 'roi' | 'change' | 'pnl') => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
  tick: () => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
  availableBalance: 5300,
  amountPercent: 0,
  isTPSL: false,
  side: 'buy',
  orderType: 'limit',
  price: toInputPrice(DEFAULT_INSTRUMENT),
  leverage: 3,
  isBatchLeverage: false,
  unit: 'value_quote',
  activeTab: 'orders',
  marginMode: 'isolated',
  selectedSymbol: DEFAULT_INSTRUMENT.symbol,
  favoriteSymbols: DEFAULT_FAVORITE_SYMBOLS,
  tickSize: null,
  orderBookMode: 'split',
  instruments: Object.fromEntries(MOCK_INSTRUMENTS.map((i) => [i.symbol, i])),
  tickCounter: 0,
  toastMessage: null,
  toastType: null,
  tpMode: 'price',
  slMode: 'price',

  isOrderTypeOpen: false,
  isLeverageOpen: false,
  isUnitOpen: false,
  isMarginModeOpen: false,
  isSymbolSelectOpen: false,
  isChartOpen: false,
  isOrderBookCardOpen: false,
  isTickSizeOpen: false,

  setAvailableBalance: (val) => set({ availableBalance: val }),
  setAmountPercent: (val) => set({ amountPercent: val }),
  setIsTPSL: (val) => set({ isTPSL: val }),
  setSide: (val) => set({ side: val }),
  setOrderType: (val) => set({ orderType: val }),
  setPrice: (val) => set({ price: val }),
  setLeverage: (val) => set({ leverage: val }),
  setIsBatchLeverage: (val) => set({ isBatchLeverage: val }),
  setUnit: (val) => set({ unit: val }),
  setActiveTab: (val) => set({ activeTab: val }),
  setMarginMode: (val) => set({ marginMode: val }),
  setSelectedSymbol: (symbol) => {
    set((state) => {
      const instrument = state.instruments[symbol] ?? state.instruments[DEFAULT_INSTRUMENT.symbol];
      return {
        selectedSymbol: instrument.symbol,
        price: toInputPrice(instrument),
        isSymbolSelectOpen: false,
        tickSize: null,
      };
    });
  },
  toggleFavoriteSymbol: (symbol) => set((state) => ({
    favoriteSymbols: state.favoriteSymbols.includes(symbol)
      ? state.favoriteSymbols.filter((favorite) => favorite !== symbol)
      : [...state.favoriteSymbols, symbol],
  })),

  setOrderTypeOpen: (isOpen) => set({ isOrderTypeOpen: isOpen }),
  setLeverageOpen: (isOpen) => set({ isLeverageOpen: isOpen }),
  setUnitOpen: (isOpen) => set({ isUnitOpen: isOpen }),
  setMarginModeOpen: (isOpen) => set({ isMarginModeOpen: isOpen }),
  setSymbolSelectOpen: (isOpen) => set({ isSymbolSelectOpen: isOpen }),
  setChartOpen: (isOpen) => set({ isChartOpen: isOpen }),
  setOrderBookCardOpen: (isOpen) => set({ isOrderBookCardOpen: isOpen }),
  setTickSizeOpen: (isOpen) => set({ isTickSizeOpen: isOpen }),
  setTickSize: (val) => set({ tickSize: val, isTickSizeOpen: false }),
  setOrderBookMode: (mode) => set({ orderBookMode: mode }),
  cycleOrderBookMode: () => set((state) => {
    const modes: OrderBookMode[] = ['split', 'bids', 'asks'];
    const currentIndex = modes.indexOf(state.orderBookMode);
    return { orderBookMode: modes[(currentIndex + 1) % modes.length] };
  }),
  setTpMode: (mode) => set({ tpMode: mode }),
  setSlMode: (mode) => set({ slMode: mode }),
  showToast: (message, type = 'success') => {
    set({ toastMessage: message, toastType: type });
    setTimeout(() => {
      set({ toastMessage: null, toastType: null });
    }, 3000);
  },
  hideToast: () => set({ toastMessage: null, toastType: null }),
  tick: () => set((state) => {
    const newInstruments = { ...state.instruments };
    let hasChanges = false;
    for (const sym in newInstruments) {
      if (Math.random() > 0.6) continue;
      
      const inst = { ...newInstruments[sym] };
      const step = 10 ** -inst.priceDecimals;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const ticks = Math.floor(Math.random() * 3) + 1;
      
      inst.price = Math.max(step, inst.price + (step * direction * ticks));
      if (inst.price > inst.high24h) inst.high24h = inst.price;
      if (inst.price < inst.low24h) inst.low24h = inst.price;
      inst.changePercent += direction * 0.01 * ticks;
      
      newInstruments[sym] = inst;
      hasChanges = true;
    }
    return { 
      instruments: hasChanges ? newInstruments : state.instruments,
      tickCounter: state.tickCounter + 1 
    };
  }),
}));

export const useInstrument = (symbol?: string) => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  return useCryptoStore(state => state.instruments[symbol || selectedSymbol] || state.instruments[DEFAULT_INSTRUMENT.symbol]);
};
