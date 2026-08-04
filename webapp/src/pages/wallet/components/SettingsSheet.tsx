import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useWalletStore } from '../../../store/walletStore';
import { useBackButton } from '../../../hooks';
import { slideFromRight } from '../../../shared/animations';

interface SettingsScreenProps {
  onClose: () => void;
  isDesktopInline?: boolean;
}

export const SettingsScreen = ({ onClose, isDesktopInline }: SettingsScreenProps) => {
  useBackButton(onClose);

  const handleLogout = () => {
    if (window.confirm("Вы уверены, что хотите удалить кошелек с устройства? Без сид-фразы вы потеряете к нему доступ навсегда.")) {
      useWalletStore.getState().clearWallet();
      window.location.reload();
    }
  };

  const content = (
      <motion.div
        variants={slideFromRight}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={isDesktopInline ? "w-full h-full rounded-3xl border border-white/5 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden relative" : "absolute inset-0 md:relative md:inset-auto md:w-[480px] md:h-[85vh] md:rounded-3xl md:border md:border-zinc-800 md:shadow-2xl flex flex-col overflow-hidden bg-black md:bg-zinc-950"}
      >
        <div className="bg-black px-4 pb-4" style={{ paddingTop: 'calc(16px + var(--safe-top, 0px))' }}>
          <h3 className="text-2xl font-bold text-white">Настройки</h3>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar" style={{ paddingBottom: 'calc(80px + var(--safe-bottom, 0px))' }}>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl transition-colors border border-red-500/20 w-full"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm">Выйти из кошелька</p>
              <p className="text-xs text-red-500/70">Удалить данные с устройства</p>
            </div>
          </button>
        </div>
      </motion.div>
  );

  if (isDesktopInline) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden md:bg-black/60 md:backdrop-blur-sm bg-black">
      {content}
    </div>
  );
};
