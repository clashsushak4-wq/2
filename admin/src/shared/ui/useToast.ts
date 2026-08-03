import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastState {
  toasts: Toast[];
  add: (message: string, type?: Toast['type']) => void;
  remove: (id: string) => void;
  timeouts: Record<string, ReturnType<typeof setTimeout>>;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  timeouts: {},
  add: (message, type = 'success') => {
    const id = Date.now().toString();
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    const timeoutId = setTimeout(() => {
      set((s) => {
        const newTimeouts = { ...s.timeouts };
        delete newTimeouts[id];
        return { toasts: s.toasts.filter((t) => t.id !== id), timeouts: newTimeouts };
      });
    }, 3000);
    set((s) => ({ timeouts: { ...s.timeouts, [id]: timeoutId } }));
  },
  remove: (id) => set((s) => {
    if (s.timeouts[id]) clearTimeout(s.timeouts[id]);
    const newTimeouts = { ...s.timeouts };
    delete newTimeouts[id];
    return { toasts: s.toasts.filter((t) => t.id !== id), timeouts: newTimeouts };
  }),
}));
