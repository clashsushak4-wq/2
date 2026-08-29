import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const getInitData = (): string => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData || '';
  }
  return '';
};



export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const initData = getInitData();
  if (initData) {
    config.headers.Authorization = `tma ${initData}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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

export const api = {
  user: {
    getMe: async () => {
      const response = await apiClient.get('/users/me');
      return response.data;
    }
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
    closeTicket: async (ticketId: number) => {
      const response = await apiClient.post(`/support/ticket/${ticketId}/close`);
      return response.data;
    },
  },

  home: {
    getLayout: async (): Promise<HomeTile[]> => {
      const response = await apiClient.get('/home/layout');
      return response.data;
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
