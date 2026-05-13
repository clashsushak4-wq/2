import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const STORAGE_KEY = 'admin_token';

const getAuthHeader = (): string | null => {
  // 1. Telegram initData (приоритет)
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const initData = window.Telegram.WebApp.initData;
    if (initData) return `tma ${initData}`;
  }
  // 2. Admin token из localStorage
  const token = localStorage.getItem(STORAGE_KEY);
  if (token) return `Admin ${token}`;
  return null;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

apiClient.interceptors.request.use((cfg) => {
  const auth = getAuthHeader();
  if (auth) {
    cfg.headers = cfg.headers ?? {};
    (cfg.headers as Record<string, string>).Authorization = auth;
  }
  return cfg;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('API Error:', err.response?.data || err.message);
    if (err.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('admin:unauthorized'));
    }
    return Promise.reject(err);
  },
);

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

export interface ExpandBlock {
  type: 'text' | 'image' | 'video' | 'link';
  value: string;
  label?: string;
}

export interface HomeTile {
  id: number;
  type: string;
  size: string;
  order: number;
  is_active: boolean;
  content: TileContent;
}

export interface HomeTileCreate {
  type: string;
  size: string;
  order: number;
  is_active: boolean;
  content: HomeTile['content'];
}

export interface HomeTileUpdate {
  type?: string;
  size?: string;
  order?: number;
  is_active?: boolean;
  content?: HomeTile['content'];
}

export interface AdminStatsResponse {
  total_users: number;
  new_today: number;
  new_week: number;
  with_notifications: number;
  with_nickname: number;
  tickets_new: number;
}

export interface ExchangeItem {
  id: number;
  name: string;
  api_key_masked: string;
  is_active: boolean;
  created_at: string;
}

export type TicketStatus = 'new' | 'in_progress' | 'closed';

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender: 'user' | 'admin';
  text: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  user_nick: string | null;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}

export interface SupportTicketDetail extends SupportTicket {
  messages: TicketMessage[];
}

export interface SupportCounts {
  new: number;
  active: number;
  closed: number;
}

export interface BotMediaSlot {
  key: string;
  title: string;
  description: string;
}

export interface BotMediaItem {
  key: string;
  file_url: string | null;
  thumb_url: string | null;
  updated_at: string | null;
}

export interface UploadResult {
  url: string;
  thumb_url: string | null;
}

export const api = {
  uploads: {
    upload: async (file: Blob, filename: string): Promise<UploadResult> => {
      const form = new FormData();
      form.append('file', file, filename);
      const res = await apiClient.post('/uploads/admin/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return { url: res.data.url, thumb_url: res.data.thumb_url ?? null };
    },
  },
  users: {
    getStats: async (): Promise<AdminStatsResponse> => {
      const res = await apiClient.get('/users/admin/stats');
      return res.data;
    },
  },
  tiles: {
    getAll: async (): Promise<HomeTile[]> => {
      const res = await apiClient.get('/home/admin/layout');
      return res.data;
    },
    create: async (data: HomeTileCreate): Promise<HomeTile> => {
      const res = await apiClient.post('/home/admin/layout', data);
      return res.data;
    },
    update: async (id: number, data: HomeTileUpdate): Promise<HomeTile> => {
      const res = await apiClient.put(`/home/admin/layout/${id}`, data);
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/home/admin/layout/${id}`);
    },
    reorder: async (orders: { id: number; order: number }[]): Promise<void> => {
      await apiClient.post('/home/admin/layout/reorder', orders);
    },
  },
  exchanges: {
    getAll: async (): Promise<ExchangeItem[]> => {
      const res = await apiClient.get('/admin/exchanges/');
      return res.data;
    },
    create: async (name: string, api_key: string, api_secret: string): Promise<ExchangeItem> => {
      const res = await apiClient.post('/admin/exchanges/', { name, api_key, api_secret });
      return res.data;
    },
    delete: async (id: number): Promise<void> => {
      await apiClient.delete(`/admin/exchanges/${id}`);
    },
  },
  support: {
    getCounts: async (): Promise<SupportCounts> => {
      const res = await apiClient.get('/support/admin/counts');
      return res.data;
    },
    getTickets: async (status: TicketStatus = 'new'): Promise<SupportTicket[]> => {
      const res = await apiClient.get('/support/admin/tickets', { params: { status } });
      return res.data;
    },
    getTicket: async (ticketId: number): Promise<SupportTicketDetail> => {
      const res = await apiClient.get(`/support/admin/ticket/${ticketId}`);
      return res.data;
    },
    sendMessage: async (ticketId: number, text: string): Promise<TicketMessage> => {
      const res = await apiClient.post(`/support/admin/ticket/${ticketId}/message`, { text });
      return res.data;
    },
    closeTicket: async (ticketId: number): Promise<void> => {
      await apiClient.post(`/support/admin/ticket/${ticketId}/close`);
    },
  },
  botMedia: {
    getSlots: async (): Promise<BotMediaSlot[]> => {
      const res = await apiClient.get('/admin/bot-media/slots');
      return res.data;
    },
    getAll: async (): Promise<BotMediaItem[]> => {
      const res = await apiClient.get('/admin/bot-media/');
      return res.data;
    },
    set: async (key: string, fileUrl: string, thumbUrl: string | null): Promise<BotMediaItem> => {
      const res = await apiClient.put(`/admin/bot-media/${key}`, {
        file_url: fileUrl,
        thumb_url: thumbUrl,
      });
      return res.data;
    },
    delete: async (key: string): Promise<void> => {
      await apiClient.delete(`/admin/bot-media/${key}`);
    },
  },
};
