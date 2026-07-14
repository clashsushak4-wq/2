import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { TAP_TILE } from '../../../../shared/animations';
import { useTranslation } from '../../../../i18n';

export const SettingsTile = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const handleClose = useCallback(() => setShowModal(false), []);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)}
        className={`bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors rounded-2xl p-4 md:p-5 flex items-center gap-4 ${TAP_TILE} relative overflow-hidden w-full text-left`}
      >
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-br-full pointer-events-none" />
        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
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
