import { LogOut } from 'lucide-react';
import { useWalletStore } from '../../../store/walletStore';

export const SettingsSheet = () => {
  const handleLogout = () => {
    if (window.confirm("Вы уверены, что хотите удалить кошелек с устройства? Без сид-фразы вы потеряете к нему доступ навсегда.")) {
      useWalletStore.getState().clearWallet();
      window.location.reload();
    }
  };

  return (
    <div className="px-4 pb-8">
      <div className="flex flex-col gap-2">
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
    </div>
  );
};
