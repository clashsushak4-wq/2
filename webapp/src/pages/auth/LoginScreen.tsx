import { useState } from 'react';
import { motion } from 'framer-motion';
import { LoginForm, LoginHeader } from './components';
import { api } from '../../api/client';
import { useAuthStore } from '../../store';
import { useTranslation } from '../../i18n';

interface LoginScreenProps {
  nickname: string;
  onSuccess?: () => void;
}

export const LoginScreen = ({ nickname, onSuccess }: LoginScreenProps) => {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (password: string) => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await api.auth.login(nickname, password);
      setSession({
        token: response.token,
        expiresAt: new Date(response.expires_at).getTime(),
        nickname: response.nickname,
        userId: response.user_id,
      });
      onSuccess?.();
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setErrorMessage(t('auth.errorInvalidCredentials'));
      else if (status === 429) setErrorMessage(t('auth.errorTooManyAttempts'));
      else if (status === 400) setErrorMessage(t('auth.errorBadRequest'));
      else setErrorMessage(t('auth.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      key="login-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center px-6"
      style={{
        paddingTop: 'calc(48px + var(--safe-top, 0px))',
        paddingBottom: 'calc(32px + var(--safe-bottom, 0px))',
      }}
    >
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-8">
        <LoginHeader nickname={nickname} />
        <LoginForm
          nickname={nickname}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      </div>

      <p className="text-zinc-600 text-xs text-center max-w-xs">{t('auth.hint')}</p>
    </motion.div>
  );
};
