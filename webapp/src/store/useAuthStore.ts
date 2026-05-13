import { create } from 'zustand';

const STORAGE_KEY = 'webapp_auth';

export interface AuthSession {
  token: string;
  expiresAt: number; // unix ms
  nickname: string;
  userId: number;
}

interface AuthState {
  session: AuthSession | null;
  isHydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  hydrate: () => void;
  isValid: () => boolean;
}

const readStored = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthSession>;
    if (
      typeof parsed.token === 'string' &&
      typeof parsed.expiresAt === 'number' &&
      typeof parsed.nickname === 'string' &&
      typeof parsed.userId === 'number'
    ) {
      if (parsed.expiresAt > Date.now()) {
        return parsed as AuthSession;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
};

const persist = (session: AuthSession | null) => {
  try {
    if (session) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* ignore */
  }
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  isHydrated: false,
  setSession: (session) => {
    persist(session);
    set({ session });
  },
  clearSession: () => {
    persist(null);
    set({ session: null });
  },
  hydrate: () => {
    const stored = readStored();
    set({ session: stored, isHydrated: true });
  },
  isValid: () => {
    const s = get().session;
    return !!s && s.expiresAt > Date.now() && s.token.length > 0;
  },
}));

export const getAuthToken = (): string | null => {
  const session = useAuthStore.getState().session;
  if (!session) return null;
  if (session.expiresAt <= Date.now()) return null;
  return session.token;
};
