import { useCallback, useEffect, useState } from 'react';
import { api } from '../../../api/client';
import { useAuthStore } from '../../../store';

export type AuthScreenState =
  | { status: 'checking' }
  | { status: 'no_password' }
  | { status: 'needs_login'; nickname: string }
  | { status: 'authenticated' }
  | { status: 'error'; message: string };

interface UseAuthSessionParams {
  enabled: boolean;
}

export const useAuthSession = ({ enabled }: UseAuthSessionParams) => {
  const [state, setState] = useState<AuthScreenState>({ status: 'checking' });
  const session = useAuthStore((s) => s.session);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const clearSession = useAuthStore((s) => s.clearSession);

  // Hydrate auth store from localStorage один раз при старте.
  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [hydrate, isHydrated]);

  const validateLocalSession = useCallback((): boolean => {
    if (!session) return false;
    if (session.expiresAt <= Date.now()) {
      clearSession();
      return false;
    }
    return true;
  }, [session, clearSession]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setState({ status: 'checking' });

    // 1. Локальный токен валиден — впускаем без сетевого запроса.
    if (validateLocalSession()) {
      try {
        // Проверим что backend всё ещё принимает токен.
        await api.auth.me();
        setState({ status: 'authenticated' });
        return;
      } catch (err: any) {
        if (err?.response?.status === 401) {
          // Токен протух на сервере — продолжаем поток ниже.
          clearSession();
        } else {
          // Сеть/500 — показываем ошибку, но не теряем сессию насильно.
          setState({ status: 'error', message: err?.message || 'Network error' });
          return;
        }
      }
    }

    // 2. Нет валидного токена — спрашиваем у backend, что делать.
    try {
      const status = await api.auth.status();
      if (!status.has_password || !status.nickname) {
        setState({ status: 'no_password' });
        return;
      }
      setState({ status: 'needs_login', nickname: status.nickname });
    } catch (err: any) {
      const code = err?.response?.status;
      const message =
        code === 401 ? 'auth.errorGeneric' : err?.message || 'auth.errorGeneric';
      setState({ status: 'error', message });
    }
  }, [enabled, validateLocalSession, clearSession]);

  useEffect(() => {
    if (!enabled || !isHydrated) return;
    refresh();
  }, [enabled, isHydrated, refresh]);

  return {
    state,
    refresh,
    onLoginSuccess: () => setState({ status: 'authenticated' }),
  };
};
