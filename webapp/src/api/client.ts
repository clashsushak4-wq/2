import axios from 'axios';
import { getAuthToken, useAuthStore } from '../store/useAuthStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getInitData = (): string => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData || '';
  }
  return '';
};

const isDev = import.meta.env.DEV;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(isDev ? { 'ngrok-skip-browser-warning': 'true' } : {}),
  },
  timeout: 10000,
});

// Эндпоинты, которые ВСЕГДА должны идти с Telegram initData,
// даже если сессионный токен есть в localStorage (сессии ещё нет,
// либо мы хотим узнать её статус по tg_id из initData).
const FORCE_INIT_DATA_PATHS = ['/webapp/auth/status', '/webapp/auth/login', '/webapp/auth/rules'];

apiClient.interceptors.request.use((config) => {
  const path = config.url || '';
  const forceInitData = FORCE_INIT_DATA_PATHS.some((p) => path.includes(p));
  const token = forceInitData ? null : getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const initData = getInitData();
    if (initData) {
      config.headers.Authorization = `tma ${initData}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Если сессионный токен протух — снимаем его, UI решит что делать дальше.
    const status = error?.response?.status;
    const url: string = error?.config?.url || '';
    const usedBearer = (error?.config?.headers?.Authorization || '').startsWith('Bearer ');
    if (status === 401 && usedBearer && !FORCE_INIT_DATA_PATHS.some((p) => url.includes(p))) {
      try {
        useAuthStore.getState().clearSession();
      } catch {
        /* ignore */
      }
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface ExpandBlock {
  type: 'text' | 'image' | 'video' | 'link';
  value: string;
  label?: string;
}

export interface TileContent {
  title?: string;
  description?: string;
  image_url?: string;
  action_url?: string;
  action_text?: string;
  colSpan?: number;
  rowSpan?: number;
  bg_color?: string;
  bg_opacity?: number;
  bg_image?: string;
  bg_images?: string[];
  rotation_interval?: number;
  auto_rotate?: boolean;
  expandable?: boolean;
  expand_blocks?: ExpandBlock[];
}

export interface HomeTile {
  id: number;
  type: string;
  size: string;
  order: number;
  is_active: boolean;
  content: TileContent;
}

export type MarketType = 'spot' | 'futures';

export interface AuthStatusResponse {
  has_password: boolean;
  nickname: string | null;
  requires_password: boolean;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  expires_at: string;
  user_id: number;
  nickname: string;
}

export interface PasswordRules {
  min_length: number;
  max_length: number;
}

export interface WhoAmIResponse {
  user_id: number;
  nickname: string | null;
  expires_at: string | null;
}

export interface SymbolInfo {
  symbol: string;
  base: string;
  quote: string;
  volume_24h: number;
  price: number;
  change_24h: number;
}

export const api = {
  auth: {
    status: async (): Promise<AuthStatusResponse> => {
      const response = await apiClient.get('/webapp/auth/status');
      return response.data;
    },
    rules: async (): Promise<PasswordRules> => {
      const response = await apiClient.get('/webapp/auth/rules');
      return response.data;
    },
    login: async (nickname: string, password: string): Promise<LoginResponse> => {
      const response = await apiClient.post('/webapp/auth/login', { nickname, password });
      return response.data;
    },
    me: async (): Promise<WhoAmIResponse> => {
      const response = await apiClient.get('/webapp/auth/me');
      return response.data;
    },
    logout: async (): Promise<void> => {
      await apiClient.post('/webapp/auth/logout');
    },
    logoutAll: async (): Promise<void> => {
      await apiClient.post('/webapp/auth/logout-all');
    },
  },

  support: {
    getMyTicket: async () => {
      const response = await apiClient.get('/support/my-ticket');
      return response.data;
    },
    createTicket: async () => {
      const response = await apiClient.post('/support/my-ticket');
      return response.data;
    },
    sendMessage: async (ticketId: number, text: string) => {
      const response = await apiClient.post(`/support/ticket/${ticketId}/message`, { text });
      return response.data;
    },
  },

  home: {
    getLayout: async (): Promise<HomeTile[]> => {
      const response = await apiClient.get('/home/layout');
      return response.data;
    },
  },

  charts: {
    getCryptoOHLCV: async (symbol: string, timeframe = '1h', limit = 1500) => {
      const res = await apiClient.get(`/charts/crypto/ohlcv/${symbol}`, {
        params: { timeframe, limit },
        timeout: 30000,
      });
      return res.data as {
        symbol: string;
        timeframe: string;
        candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
        exchange: string;
      };
    },
    getCryptoOHLCVBefore: async (
      symbol: string,
      timeframe: string,
      limit: number,
      endTime: number,
    ) => {
      const res = await apiClient.get(`/charts/crypto/ohlcv/${symbol}`, {
        params: { timeframe, limit, end_time: endTime * 1000 },
        timeout: 30000,
      });
      return res.data as {
        symbol: string;
        timeframe: string;
        candles: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
        exchange: string;
      };
    },
    getSymbols: async (market: MarketType = 'futures', limit = 200): Promise<SymbolInfo[]> => {
      const res = await apiClient.get('/charts/crypto/symbols', {
        params: { market, limit },
        timeout: 30000,
      });
      return res.data;
    },
  },

  news: {
    getCrypto: async () => {
      const response = await apiClient.get('/news/crypto');
      return response.data;
    },
    getForex: async () => {
      const response = await apiClient.get('/news/forex');
      return response.data;
    },
    getArticle: async (url: string) => {
      const response = await apiClient.get('/news/article', { params: { url } });
      return response.data as { content: string; images: string[] };
    },
  },
};
