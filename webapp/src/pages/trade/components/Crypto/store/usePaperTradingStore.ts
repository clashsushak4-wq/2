import { create } from 'zustand';
import axios from 'axios';
import { apiClient } from '../../../../../api/client';
import { useMarketStore } from './useMarketStore';
import type { MarketSource } from '../data/marketData';
import type { AttachedTPSL, PaperAccount, PaperFill, PaperLedgerEntry, PaperOrder, PaperPosition,
  PlacePaperOrderInput, TradingActionResult } from '../domain/types';
export { calculatePaperAccount } from '../domain/demoAccount';

export interface TradingSnapshot {
  id: string;
  archives?: TradingSnapshot[];
  source: MarketSource | null;
  revision: number;
  startingBalance: number;
  walletBalance: number;
  realizedPnl: number;
  paidFees: number;
  fundingPaid: number;
  account: PaperAccount;
  orders: PaperOrder[];
  fills: PaperFill[];
  positions: PaperPosition[];
  ledger: PaperLedgerEntry[];
}
interface AccountResponse {
  state: TradingSnapshot | null;
  executionReady: boolean;
  executionError: string | null;
  fundingErrors?: Record<string, string>;
  result?: TradingActionResult & { status: PaperOrder['status']; reason: string | null; orderId: string };
}
export interface PlaceOrderResult {
  ok: boolean; status: PaperOrder['status']; orderId: string; reason: string | null;
}
interface PaperTradingState extends TradingSnapshot {
  exists: boolean;
  loaded: boolean;
  busy: boolean;
  executionReady: boolean;
  error: string | null;
  fundingErrors: Record<string, string>;
  refresh: () => Promise<void>;
  clear: () => void;
  createAccount: () => Promise<void>;
  resetAccount: () => Promise<TradingActionResult>;
  placeOrder: (input: PlacePaperOrderInput) => Promise<PlaceOrderResult>;
  cancelOrder: (orderId: string) => Promise<TradingActionResult>;
  cancelAllOrders: (symbol?: string) => Promise<TradingActionResult>;
  closePosition: (symbol: string, quantity?: number) => Promise<TradingActionResult>;
  updatePositionTPSL: (symbol: string, tpsl: AttachedTPSL) => Promise<TradingActionResult>;
}
const empty = (): TradingSnapshot => ({
  id: '', source: null, revision: -1, startingBalance: 0, walletBalance: 0, realizedPnl: 0, paidFees: 0, fundingPaid: 0,
  account: { startingBalance: 0, walletBalance: 0, reservedMargin: 0, positionMargin: 0, unrealizedPnl: 0,
    realizedPnl: 0, paidFees: 0, fundingPaid: 0, equity: 0, availableBalance: 0 },
  orders: [], fills: [], positions: [], ledger: [],
});
const errorCode = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (error.response?.status === 401 || error.response?.status === 422) return 'authentication_required';
  }
  return 'account_request_failed';
};
let refreshInFlight = false;
let generation = 0;

export const usePaperTradingStore = create<PaperTradingState>((set, get) => {
  const apply = (response: AccountResponse, version: string | null, epoch: number) => {
    if (epoch !== generation || version !== useMarketStore.getState().version) return;
    const current = get();
    if (response.state && current.source?.key === response.state.source?.key && response.state.revision < current.revision) return;
    set({ ...(response.state ?? empty()), loaded: true, exists: response.state !== null,
      executionReady: response.executionReady, error: response.executionError,
      fundingErrors: response.fundingErrors ?? {} });
  };
  const command = async (values: Record<string, unknown>): Promise<AccountResponse['result']> => {
    if (get().busy) return { ok: false, code: 'request_in_progress', affectedCount: 0, status: 'rejected', reason: 'request_in_progress', orderId: '' };
    const version = useMarketStore.getState().version, epoch = generation;
    set({ busy: true });
    const accountId = get().id;
    try {
      let response;
      try { response = await apiClient.post<AccountResponse>('/trade/command', { version, accountId, ...values }); }
      catch (error) {
        if (!axios.isAxiosError(error) || error.response || !values.clientOrderId) throw error;
        // Retry transport failures with the same idempotency key.
        response = await apiClient.post<AccountResponse>('/trade/command', { version, accountId, ...values });
      }
      apply(response.data, version, epoch);
      return response.data.result;
    } catch (error) {
      const code = errorCode(error);
      if (epoch === generation) set({ error: code });
      return { ok: false, code, affectedCount: 0, status: 'rejected', reason: code, orderId: '' };
    } finally { if (epoch === generation) set({ busy: false }); }
  };
  return {
    ...empty(), exists: false, loaded: false, busy: false, executionReady: false, error: null, fundingErrors: {},
    clear: () => { generation += 1; set({ ...empty(), exists: false, loaded: false, busy: false, error: null, executionReady: false }); },
    refresh: async () => {
      if (refreshInFlight || !useMarketStore.getState().source) return;
      refreshInFlight = true;
      const version = useMarketStore.getState().version, epoch = generation;
      try {
        const response = await apiClient.get<AccountResponse>('/trade/account');
        apply(response.data, version, epoch);
      } catch (error) { if (epoch === generation) set({ error: errorCode(error), loaded: true, executionReady: false }); }
      finally { refreshInFlight = false; }
    },
    createAccount: async () => {
      if (get().busy) return;
      const version = useMarketStore.getState().version, epoch = generation;
      set({ busy: true });
      try {
        const response = await apiClient.post<AccountResponse>('/trade/account', { version });
        apply(response.data, version, epoch);
      } catch (error) { if (epoch === generation) set({ error: errorCode(error) }); }
      finally { if (epoch === generation) set({ busy: false }); }
    },
    placeOrder: async input => {
      const { spec: _spec, marketPrice: _price, isMarketableLimit: _marketable, ...order } = input;
      const result = await command({ action: 'order', ...order });
      return result ?? { ok: false, status: 'rejected', orderId: '', reason: 'account_request_failed' };
    },
    resetAccount: async () => (await command({ action: 'reset', clientOrderId: crypto.randomUUID() }))!,
    cancelOrder: async orderId => (await command({ action: 'cancel', orderId }))!,
    cancelAllOrders: async symbol => (await command({ action: 'cancel_all', symbol }))!,
    closePosition: async (symbol, quantity) => (await command({ action: 'close', symbol, quantity, clientOrderId: crypto.randomUUID() }))!,
    updatePositionTPSL: async (symbol, tpsl) => (await command({ action: 'tpsl', symbol, tpsl }))!,
  };
});
