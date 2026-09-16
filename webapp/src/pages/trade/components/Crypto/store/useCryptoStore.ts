import { create } from 'zustand';

export type OrderSide = 'buy' | 'sell';
export type OrderType = 'limit' | 'market';
export type UnitType = 'qty_btc' | 'cost_usdt' | 'value_usdt';
export type TabType = 'orders' | 'positions' | 'screener' | 'history';

interface CryptoState {
  amountPercent: number;
  isTPSL: boolean;
  side: OrderSide;
  orderType: OrderType;
  leverage: number;
  unit: UnitType;
  activeTab: TabType;
  
  isOrderTypeOpen: boolean;
  isLeverageOpen: boolean;
  isUnitOpen: boolean;

  setAmountPercent: (val: number) => void;
  setIsTPSL: (val: boolean) => void;
  setSide: (val: OrderSide) => void;
  setOrderType: (val: OrderType) => void;
  setLeverage: (val: number) => void;
  setUnit: (val: UnitType) => void;
  setActiveTab: (val: TabType) => void;
  
  setOrderTypeOpen: (isOpen: boolean) => void;
  setLeverageOpen: (isOpen: boolean) => void;
  setUnitOpen: (isOpen: boolean) => void;
}

export const useCryptoStore = create<CryptoState>((set) => ({
  amountPercent: 0,
  isTPSL: false,
  side: 'buy',
  orderType: 'limit',
  leverage: 3,
  unit: 'value_usdt',
  activeTab: 'orders',

  isOrderTypeOpen: false,
  isLeverageOpen: false,
  isUnitOpen: false,

  setAmountPercent: (val) => set({ amountPercent: val }),
  setIsTPSL: (val) => set({ isTPSL: val }),
  setSide: (val) => set({ side: val }),
  setOrderType: (val) => set({ orderType: val }),
  setLeverage: (val) => set({ leverage: val }),
  setUnit: (val) => set({ unit: val }),
  setActiveTab: (val) => set({ activeTab: val }),
  
  setOrderTypeOpen: (isOpen) => set({ isOrderTypeOpen: isOpen }),
  setLeverageOpen: (isOpen) => set({ isLeverageOpen: isOpen }),
  setUnitOpen: (isOpen) => set({ isUnitOpen: isOpen }),
}));
