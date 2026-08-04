import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { TAP_TILE } from '../../../../shared/animations';
import { useTranslation } from '../../../../i18n';

interface Props {
  onClick?: () => void;
  isActive?: boolean;
}

export const SettingsTile = ({ onClick, isActive }: Props = {}) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const handleClose = useCallback(() => setShowModal(false), []);

  const handleClick = () => {
    if (onClick) onClick();
    else setShowModal(true);
  };

  return (
    <>
      <button 
        onClick={handleClick}
        className={`bg-zinc-900/50 backdrop-blur-xl border ${isActive ? 'border-blue-500/50 bg-blue-500/10' : 'border-white/5'} hover:bg-zinc-800/80 hover:border-white/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 rounded-2xl p-4 md:p-5 flex items-center gap-4 ${TAP_TILE} relative overflow-hidden w-full text-left`}
      >
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-br-full pointer-events-none" />
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-zinc-400'}`}>
           <Settings size={22} />
        </div>
        <p className="text-white text-base font-medium relative z-10">{t('profile.settings')}</p>
      </button>

      <AnimatePresence>
        {showModal && <SettingsModal onClose={handleClose} />}
      </AnimatePresence>
    </>
  );
};
