import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';

// Кастомный драйвер хранилища (Telegram Cloud + fallback на localStorage)
const cloudStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return new Promise((resolve) => {
      // @ts-ignore - игнорируем ошибку типов для глобального объекта Telegram
      if (window.Telegram?.WebApp?.CloudStorage) {
        // @ts-ignore
        window.Telegram.WebApp.CloudStorage.getItem(name, (err, value) => {
          if (err || !value) {
            resolve(localStorage.getItem(name));
          } else {
            resolve(value);
          }
        });
      } else {
        resolve(localStorage.getItem(name));
      }
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    return new Promise((resolve) => {
      // @ts-ignore
      if (window.Telegram?.WebApp?.CloudStorage) {
        // @ts-ignore
        window.Telegram.WebApp.CloudStorage.setItem(name, value, (err) => {
          localStorage.setItem(name, value);
          resolve();
        });
      } else {
        localStorage.setItem(name, value);
        resolve();
      }
    });
  },
  removeItem: async (name: string): Promise<void> => {
    return new Promise((resolve) => {
      // @ts-ignore
      if (window.Telegram?.WebApp?.CloudStorage) {
        // @ts-ignore
        window.Telegram.WebApp.CloudStorage.removeItem(name, (err) => {
          localStorage.removeItem(name);
          resolve();
        });
      } else {
        localStorage.removeItem(name);
        resolve();
      }
    });
  }
};

interface WalletState {
  hasWallet: boolean;
  address: string | null;
  encryptedMnemonic: string | null; // Хранится только в зашифрованном виде
  balanceTON: string;
  balanceUSDT: string;
  
  setWallet: (address: string, encryptedMnemonic: string) => void;
  setBalances: (ton: string, usdt: string) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      hasWallet: false,
      address: null,
      encryptedMnemonic: null,
      balanceTON: "0.0",
      balanceUSDT: "0.0",

      setWallet: (address, encryptedMnemonic) => 
        set({ hasWallet: true, address, encryptedMnemonic }),
        
      setBalances: (ton, usdt) => 
        set({ balanceTON: ton, balanceUSDT: usdt }),
        
      clearWallet: () => 
        set({ hasWallet: false, address: null, encryptedMnemonic: null, balanceTON: "0.0", balanceUSDT: "0.0" }),
    }),
    {
      name: 'local-wallet-storage',
      storage: createJSONStorage(() => cloudStorage), // Подключаем гибридное облачное хранилище
      partialize: (state) => ({ 
        hasWallet: state.hasWallet, 
        address: state.address, 
        encryptedMnemonic: state.encryptedMnemonic 
      }),
    }
  )
);
