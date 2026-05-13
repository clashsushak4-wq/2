import { create } from 'zustand';
import type { HomeTile } from '../api/client';

export interface AppUser {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
}

export type MarketType = 'crypto' | 'screener';

interface AppState {
  user: AppUser | null;
  isFullscreen: boolean;
  homeTiles: HomeTile[] | null;
  activeMarket: MarketType | null;
  setUser: (user: AppUser | null) => void;
  setFullscreen: (isFullscreen: boolean) => void;
  setHomeTiles: (tiles: HomeTile[]) => void;
  setActiveMarket: (market: MarketType | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  isFullscreen: false,
  homeTiles: null,
  activeMarket: null,
  setUser: (user) => set({ user }),
  setFullscreen: (isFullscreen) => set({ isFullscreen }),
  setHomeTiles: (homeTiles) => set({ homeTiles }),
  setActiveMarket: (activeMarket) => set({ activeMarket }),
}));
