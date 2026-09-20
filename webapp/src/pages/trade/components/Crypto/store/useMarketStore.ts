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
let refreshInFlight = false;

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

let queuedMessages: MarketMessage[] = [];
let updateTimer: ReturnType<typeof setTimeout> | null = null;

export const useMarketStore = create<MarketState>((set, get) => {
  const flush = () => {
    const messages = queuedMessages;
    queuedMessages = [];
    updateTimer = null;
    if (!messages.length) return;

    const previous = get();
    let nextVersion = previous.version;
    let nextSequence = previous.sequence;
    let nextSource = previous.source;
    let nextStatus = previous.status;
    let nextError = previous.error;
    let nextReceivedAt = previous.receivedAt;
    let nextServerOffset = previous.serverOffset;

    let instruments = { ...previous.instruments };
    let books = { ...previous.books };
    let trades = { ...previous.trades };
    let candles = { ...previous.candles };
    let requireReset = false;
    let shouldFetchSnapshot = false;

    for (const message of messages) {
      if (!message || typeof message.version !== 'string' || !Number.isFinite(message.sequence)) continue;
      const changed = nextVersion !== null && nextVersion !== message.version;
      
      if (changed && message.type !== 'snapshot') continue;
      if (!changed && message.sequence < nextSequence) continue;
      if (!changed && nextSequence !== -1 && message.sequence > nextSequence + 1) {
        shouldFetchSnapshot = true;
        continue;
      }

      const snapshot = message.type === 'snapshot';
      if (snapshot || changed) {
        instruments = snapshot ? {} : { ...instruments };
        requireReset = true;
      }

      for (const item of message.instruments ?? []) {
        if (snapshot || !instruments[item.symbol]) {
          instruments[item.symbol] = item;
        } else {
          instruments[item.symbol] = { ...instruments[item.symbol], ...item };
        }
      }

      if (message.type === 'orderbook' && message.symbol && message.book) {
        books[message.symbol] = message.book;
      }
      if (message.type === 'trades' && message.symbol && message.trades) {
        trades[message.symbol] = message.trades;
      }
      if (message.type === 'candle' && message.symbol && message.timeframe && message.candle) {
        candles[message.symbol + ':' + message.timeframe] = message.candle;
      }

      nextVersion = message.version;
      nextSequence = message.sequence;
      nextSource = message.source;
      nextStatus = message.status;
      nextError = message.error;
      nextReceivedAt = Date.now();
      nextServerOffset = message.serverTime - Date.now();
    }

    if (shouldFetchSnapshot) {
      setTimeout(() => get().refresh(), 0);
    }

    const hasChanges = nextSequence !== previous.sequence || requireReset;
    if (!hasChanges) return;

    set({
      instruments, source: nextSource, version: nextVersion, sequence: nextSequence,
      status: nextStatus, error: nextError, receivedAt: nextReceivedAt,
      serverOffset: nextServerOffset,
      ...(requireReset ? { books: {}, trades: {}, candles: {} } : { books, trades, candles }),
    });

    const changed = previous.version !== null && previous.version !== nextVersion;
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

    if (requireReset) sendSubscription();
  };

  const apply = (message: MarketMessage) => {
    queuedMessages.push(message);
    if (!updateTimer) {
      updateTimer = setTimeout(flush, 100);
    }
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
      if (refreshInFlight) return;
      refreshInFlight = true;
      const version = get().version;
      try {
        const response = await apiClient.get<MarketMessage>('/market/snapshot');
        if (version === get().version) apply(response.data);
      } catch { set({ error: 'market_refresh_failed' }); }
      finally { refreshInFlight = false; }
    },
    subscribe: (symbol, timeframe) => { subscription = { symbol, timeframe }; sendSubscription(); },
    unsubscribe: () => {
      subscription = null;
      if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'unsubscribe' }));
    },
  };
});
