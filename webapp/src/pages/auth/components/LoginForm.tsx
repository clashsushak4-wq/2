import { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { haptic } from '../../../utils';

interface LoginFormProps {
  nickname: string;
  onSubmit: (password: string) => Promise<void>;
  isLoading: boolean;
  errorMessage: string | null;
}

export const LoginForm = ({ nickname, onSubmit, isLoading, errorMessage }: LoginFormProps) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || isLoading) return;
    haptic.medium();
    await onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-3">
      <label className="text-xs uppercase tracking-wider text-zinc-500">
        {t('auth.loginLabel')}
      </label>
      <div className="px-4 py-3 rounded-xl bg-zinc-900 border-2 border-zinc-800 text-white tabular-nums">
        #{nickname || '—'}
      </div>

      <label className="text-xs uppercase tracking-wider text-zinc-500 mt-2">
        {t('auth.passwordLabel')}
      </label>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          inputMode="text"
          className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-900 border-2 border-zinc-800 text-white text-base focus:outline-none focus:border-zinc-600 transition-colors"
          placeholder={t('auth.passwordPlaceholder')}
        />
        <button
          type="button"
          onClick={() => {
            haptic.light();
            setShowPassword((v) => !v);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 active:text-white"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {errorMessage && (
        <div className="text-sm text-rose-400 px-1 mt-1" role="alert">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!password || isLoading}
        className="mt-4 h-12 rounded-xl bg-white text-black text-[15px] font-bold active:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            {t('auth.signingIn')}
          </>
        ) : (
          t('auth.signIn')
        )}
      </button>
    </form>
  );
};
