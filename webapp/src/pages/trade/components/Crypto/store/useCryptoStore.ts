import { create } from 'zustand';
import { toInputPrice } from '../data/marketData';
import type { PricedInstrument } from '../data/marketData';
import { useMarketStore } from './useMarketStore';

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

  amountPercent: number;
  amountValue: string;
  isTPSL: boolean;
  orderIntent: OrderIntent;
  orderType: OrderType;
  price: string;
  priceDirty: boolean;
  leverage: number;
  isBatchLeverage: boolean;
  unit: UnitType;
  activeTab: TabType;
  marginMode: MarginMode;
  selectedSymbol: string;
  favoriteSymbols: string[];
  tickSize: number | null;
  orderBookMode: OrderBookMode;


  toastMessage: string | null;
  toastType: 'success' | 'error' | null;

  isOrderTypeOpen: boolean;
  isLeverageOpen: boolean;
  isUnitOpen: boolean;
  isMarginModeOpen: boolean;
  isSymbolSelectOpen: boolean;
  chartTimeframe: string;
  setChartTimeframe: (value: string) => void;
  isChartOpen: boolean;
  isOrderBookCardOpen: boolean;
  isTickSizeOpen: boolean;


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

}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useCryptoStore = create<CryptoState>((set) => ({

  amountPercent: 0,
  amountValue: '',
  isTPSL: false,
  orderIntent: 'open',
  orderType: 'limit',
  price: '',
  priceDirty: false,
  leverage: 3,
  isBatchLeverage: false,
  unit: 'value_quote',
  activeTab: 'orders',
  marginMode: 'isolated',
  selectedSymbol: '',
  favoriteSymbols: [],
  tickSize: null,
  orderBookMode: 'split',


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
  chartTimeframe: '1m',
  setChartTimeframe: value => set({ chartTimeframe: value }),
  isChartOpen: false,
  isOrderBookCardOpen: false,
  isTickSizeOpen: false,


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
  setPrice: (val) => set({ price: val, priceDirty: true }),
  setLeverage: (val) => set({ leverage: val }),
  setIsBatchLeverage: (val) => set({ isBatchLeverage: val }),
  setUnit: (val) => set({ unit: val }),
  setActiveTab: (val) => set({ activeTab: val }),
  setMarginMode: (val) => set({ marginMode: val }),
  setSelectedSymbol: (symbol) => {
    set((state) => {
      const instrument = useMarketStore.getState().instruments[symbol];
      if (!instrument) return state;
      return {
        selectedSymbol: instrument.symbol,
        price: toInputPrice(instrument),
        priceDirty: false,
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
}));

// Terminal children mount only after the selected instrument has a real price.
export const useInstrument = (symbol?: string): PricedInstrument => {
  const selectedSymbol = useCryptoStore(state => state.selectedSymbol);
  return useMarketStore(state => state.instruments[symbol || selectedSymbol]) as PricedInstrument;
};
