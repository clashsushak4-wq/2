import { create } from 'zustand';

export interface MarketTicker {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  exchange: string;
}

interface MarketState {
  tickers: Record<string, MarketTicker>;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

let ws: WebSocket | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;

export const useMarketStore = create<MarketState>((set, get) => ({
  tickers: {},
  isConnected: false,

  connect: () => {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return;
    }

    ws = new WebSocket(`${WS_URL}/ws/market`);

    ws.onopen = () => {
      console.log('[Market WS] Connected');
      set({ isConnected: true });
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'snapshot' || msg.type === 'update') {
          set((state) => {
            const newTickers = { ...state.tickers };
            for (const item of msg.data) {
              newTickers[item.symbol] = item;
            }
            return { tickers: newTickers };
          });
        }
      } catch (e) {
        console.error('[Market WS] Parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('[Market WS] Disconnected, reconnecting in 3s...');
      set({ isConnected: false });
      ws = null;
      reconnectTimer = setTimeout(() => {
        get().connect();
      }, 3000);
    };

    ws.onerror = (e) => {
      console.error('[Market WS] Error:', e);
      ws?.close();
    };
  },

  disconnect: () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      ws.close();
      ws = null;
    }
  }
}));
