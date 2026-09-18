import { create } from 'zustand';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type UnitType = 'qty_btc' | 'cost_usdt' | 'value_usdt';
export type TabType = 'orders' | 'positions' | 'screener' | 'history';
export type MarginMode = 'cross' | 'isolated';

interface CryptoState {
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
  
  isOrderTypeOpen: boolean;
  isLeverageOpen: boolean;
  isUnitOpen: boolean;
  isMarginModeOpen: boolean;
  isSymbolSelectOpen: boolean;
  isChartOpen: boolean;

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
  
  setOrderTypeOpen: (isOpen: boolean) => void;
  setLeverageOpen: (isOpen: boolean) => void;
  setUnitOpen: (isOpen: boolean) => void;
  setMarginModeOpen: (isOpen: boolean) => void;
  setSymbolSelectOpen: (isOpen: boolean) => void;
  setChartOpen: (isOpen: boolean) => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
  amountPercent: 0,
  isTPSL: false,
  side: 'buy',
  orderType: 'limit',
  price: '0.01312',
  leverage: 3,
  isBatchLeverage: false,
  unit: 'value_usdt',
  activeTab: 'orders',
  marginMode: 'isolated',

  isOrderTypeOpen: false,
  isLeverageOpen: false,
  isUnitOpen: false,
  isMarginModeOpen: false,
  isSymbolSelectOpen: false,
  isChartOpen: false,

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
  
  setOrderTypeOpen: (isOpen) => set({ isOrderTypeOpen: isOpen }),
  setLeverageOpen: (isOpen) => set({ isLeverageOpen: isOpen }),
  setUnitOpen: (isOpen) => set({ isUnitOpen: isOpen }),
  setMarginModeOpen: (isOpen) => set({ isMarginModeOpen: isOpen }),
  setSymbolSelectOpen: (isOpen) => set({ isSymbolSelectOpen: isOpen }),
  setChartOpen: (isOpen) => set({ isChartOpen: isOpen }),
}));
