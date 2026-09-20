import { create } from 'zustand';
import { apiClient } from '../../../../../api/client';
import { useCryptoStore } from './useCryptoStore';
import type { MarketBook, MarketCandle, MarketInstrument, MarketSource, MarketTrade } from '../data/marketData';

interface MarketMessage {
  type: string; version: string; sequence: number; source: MarketSource | null;
  status: string; error: string | null; serverTime: number; lastMessageAt: number | null;
  instruments?: MarketInstrument[]; symbol?: string; timeframe?: string;
  book?: MarketBook; trades?: MarketTrade[]; candle?: MarketCandle;
}
interface MarketState {
  instruments: Record<string, MarketInstrument>;
  books: Record<string, MarketBook>;
  trades: Record<string, MarketTrade[]>;
  candles: Record<string, MarketCandle>;
  source: MarketSource | null;
  version: string | null;
  sequence: number;
  status: string;
  error: string | null;
  isConnected: boolean;
  receivedAt: number;
  serverOffset: number;
  connect: () => void;
  disconnect: () => void;
  refresh: () => Promise<void>;
  subscribe: (symbol: string, timeframe: string) => void;
  unsubscribe: () => void;
}
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let heartbeat: ReturnType<typeof setInterval> | null = null;
let enabled = false;
let retry = 1000;
let subscription: { symbol: string; timeframe: string } | null = null;

export const marketWebSocketUrl = (): string => {
  const api = new URL(apiClient.defaults.baseURL || '/api', window.location.origin);
  const url = new URL('/ws/market', api);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.href;
};

function sendSubscription() {
  if (subscription && socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'subscribe', ...subscription }));
  }
}

export const useMarketStore = create<MarketState>((set, get) => {
  const apply = (message: MarketMessage) => {
    if (!message || typeof message.version !== 'string' || !Number.isFinite(message.sequence)) return;
    const previous = get();
    const changed = previous.version !== message.version;
    if (changed && message.type !== 'snapshot') return;
    if (!changed && message.sequence < previous.sequence) return;
    const snapshot = message.type === 'snapshot';
    const instruments = snapshot ? {} : { ...previous.instruments };
    for (const item of message.instruments ?? []) instruments[item.symbol] = item;
    const reset = changed || snapshot;
    set({
      instruments, source: message.source, version: message.version, sequence: message.sequence,
      status: message.status, error: message.error, receivedAt: Date.now(),
      serverOffset: message.serverTime - Date.now(),
      ...(reset ? { books: {}, trades: {}, candles: {} } : {}),
      ...(message.type === 'orderbook' && message.symbol && message.book
        ? { books: { ...previous.books, [message.symbol]: message.book } } : {}),
      ...(message.type === 'trades' && message.symbol && message.trades
        ? { trades: { ...previous.trades, [message.symbol]: message.trades } } : {}),
      ...(message.type === 'candle' && message.symbol && message.timeframe && message.candle
        ? { candles: { ...previous.candles, [message.symbol + ':' + message.timeframe]: message.candle } } : {}),
    });
    const draft = useCryptoStore.getState();
    if (changed) useCryptoStore.setState({ selectedSymbol: '', price: '', priceDirty: false, amountValue: '', amountPercent: 0, tpValue: '', slValue: '' });
    const selected = useCryptoStore.getState().selectedSymbol;
    if (!instruments[selected] || instruments[selected].price === null) {
      const first = instruments.BTCUSDT?.price ? instruments.BTCUSDT
        : Object.values(instruments).find(item => item.price !== null && item.price > 0);
      if (first) draft.setSelectedSymbol(first.symbol);
    } else if (!draft.priceDirty && draft.price === '' && instruments[selected].price !== null) {
      useCryptoStore.setState({ price: instruments[selected].price!.toFixed(instruments[selected].priceDecimals) });
    }
    if (snapshot) sendSubscription();
  };
  return {
    instruments: {}, books: {}, trades: {}, candles: {}, source: null, version: null, sequence: -1,
    status: 'connecting', error: null, isConnected: false, receivedAt: 0, serverOffset: 0,
    connect: () => {
      enabled = true;
      if (socket && socket.readyState <= WebSocket.OPEN) return;
      const connection = new WebSocket(marketWebSocketUrl());
      socket = connection;
      connection.onopen = () => {
        if (socket !== connection) return;
        retry = 1000; set({ isConnected: true });
        sendSubscription();
        heartbeat = setInterval(() => {
          if (Date.now() - get().receivedAt > 15000) {
            set({ status: 'stale', error: 'market_connection_stale' }); connection.close(); return;
          }
          if (connection.readyState === WebSocket.OPEN) connection.send(JSON.stringify({ type: 'ping' }));
        }, 5000);
      };
      connection.onmessage = event => {
        if (socket !== connection) return;
        try { apply(JSON.parse(event.data)); }
        catch { set({ error: 'invalid_market_message' }); connection.close(); }
      };
      connection.onerror = () => connection.close();
      connection.onclose = () => {
        if (socket !== connection) return;
        socket = null;
        if (heartbeat) clearInterval(heartbeat);
        heartbeat = null;
        set({ isConnected: false, status: 'stale' });
        if (enabled) {
          reconnectTimer = setTimeout(() => { reconnectTimer = null; get().connect(); }, retry);
          retry = Math.min(retry * 2, 30000);
        }
      };
    },
    disconnect: () => {
      enabled = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (heartbeat) clearInterval(heartbeat);
      reconnectTimer = null; heartbeat = null;
      const previous = socket; socket = null; previous?.close();
      set({ isConnected: false, status: 'stale' });
    },
    refresh: async () => {
      const version = get().version;
      try {
        const response = await apiClient.get<MarketMessage>('/market/snapshot');
        if (version === get().version) apply(response.data);
      } catch { set({ error: 'market_refresh_failed' }); }
    },
    subscribe: (symbol, timeframe) => { subscription = { symbol, timeframe }; sendSubscription(); },
    unsubscribe: () => {
      subscription = null;
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'unsubscribe' }));
    },
  };
});
