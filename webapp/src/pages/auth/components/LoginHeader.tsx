import { Lock } from 'lucide-react';
import { useTranslation } from '../../../i18n';

interface LoginHeaderProps {
  nickname?: string | null;
}

export const LoginHeader = ({ nickname }: LoginHeaderProps) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center mb-4">
        <Lock size={28} className="text-white" />
      </div>
      <h1 className="text-2xl font-bold text-white">{t('auth.title')}</h1>
      <p className="text-zinc-500 text-sm mt-1 max-w-xs">{t('auth.subtitle')}</p>
      {nickname && (
        <p className="mt-3 text-zinc-300 text-base font-semibold tabular-nums">#{nickname}</p>
      )}
    </div>
  );
};
