import { create } from 'zustand';
import {
  DEFAULT_FAVORITE_SYMBOLS,
  DEFAULT_INSTRUMENT,
  toInputPrice,
  MOCK_INSTRUMENTS,
} from '../data/mockInstruments.ts';
import { mockRandom } from '../engine/mockRandom.ts';
import type { MockInstrument } from '../data/mockInstruments.ts';
import type {
  MarginMode,
  OrderIntent,
  OrderType,
  TPSLMode,
  UnitType,
} from '../domain/types';

export type TabType = 'orders' | 'positions' | 'screener' | 'history';
export type OrderBookMode = 'split' | 'bids' | 'asks';
export type { MarginMode, OrderIntent, OrderType, TPSLMode, UnitType } from '../domain/types';

interface CryptoState {
  availableBalance: number;
  amountPercent: number;
  amountValue: string;
  isTPSL: boolean;
  orderIntent: OrderIntent;
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
  setAmountValue: (val: string) => void;
  setIsTPSL: (val: boolean) => void;
  setOrderIntent: (val: OrderIntent) => void;
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
  tpMode: TPSLMode;
  slMode: TPSLMode;
  tpValue: string;
  slValue: string;
  setTpMode: (mode: TPSLMode) => void;
  setSlMode: (mode: TPSLMode) => void;
  setTpValue: (value: string) => void;
  setSlValue: (value: string) => void;
  resetOrderDraft: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
  tick: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useCryptoStore = create<CryptoState>((set) => ({
  availableBalance: 5300,
  amountPercent: 0,
  amountValue: '',
  isTPSL: false,
  orderIntent: 'open',
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
  tpValue: '',
  slValue: '',

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
  setAmountValue: (val) => set({ amountValue: val }),
  setIsTPSL: (val) => set({ isTPSL: val }),
  setOrderIntent: (val) => set((state) => state.orderIntent === val
    ? state
    : {
      orderIntent: val,
      amountPercent: 0,
      amountValue: '',
      tpValue: '',
      slValue: '',
      isTPSL: false,
    }),
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
        leverage: Math.min(state.leverage, instrument.maxLeverage),
        amountPercent: 0,
        amountValue: '',
        tpValue: '',
        slValue: '',
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
  setTpValue: (value) => set({ tpValue: value }),
  setSlValue: (value) => set({ slValue: value }),
  resetOrderDraft: () => set({
    amountPercent: 0,
    amountValue: '',
    tpValue: '',
    slValue: '',
    isTPSL: false,
  }),
  showToast: (message, type = 'success') => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: message, toastType: type });
    toastTimer = setTimeout(() => {
      set({ toastMessage: null, toastType: null });
      toastTimer = null;
    }, 3000);
  },
  hideToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
    set({ toastMessage: null, toastType: null });
  },
  tick: () => set((state) => {
    const newInstruments = { ...state.instruments };
    let hasChanges = false;
    for (const sym in newInstruments) {
      if (mockRandom(sym, state.tickCounter, 0) > 0.6) continue;
      
      const inst = { ...newInstruments[sym] };
      const step = 10 ** -inst.priceDecimals;
      const direction = mockRandom(sym, state.tickCounter, 1) > 0.5 ? 1 : -1;
      const ticks = Math.floor(mockRandom(sym, state.tickCounter, 2) * 3) + 1;
      
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
