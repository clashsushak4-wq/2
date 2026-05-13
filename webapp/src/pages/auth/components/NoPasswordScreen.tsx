import { motion } from 'framer-motion';
import { ShieldAlert, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { haptic } from '../../../utils';

interface NoPasswordScreenProps {
  onRetry: () => void;
}

export const NoPasswordScreen = ({ onRetry }: NoPasswordScreenProps) => {
  const { t } = useTranslation();
  return (
    <motion.div
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
      <div className="flex flex-col items-center text-center max-w-sm gap-4">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
          <ShieldAlert size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">{t('auth.noPasswordTitle')}</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">{t('auth.noPasswordHint')}</p>
        <button
          onClick={() => {
            haptic.medium();
            onRetry();
          }}
          className="mt-4 h-12 px-6 rounded-xl bg-white text-black text-[15px] font-bold active:bg-zinc-200 flex items-center gap-2"
        >
          <RefreshCw size={18} />
          {t('common.tryAgain')}
        </button>
      </div>
    </motion.div>
  );
};
