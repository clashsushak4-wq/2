import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Settings } from 'lucide-react';
import { useWalletStore } from '../../../store/walletStore';
import { fetchBalances } from '../../../utils/tonapi';

interface DashboardProps {
  onSendClick: () => void;
  onReceiveClick: () => void;
  onSettingsClick: () => void;
  onAssetClick: (currency: 'GRAM' | 'USDT') => void;
}

export const Dashboard = ({ onSendClick, onReceiveClick, onSettingsClick, onAssetClick }: DashboardProps) => {
  const { address, balanceGRAM, balanceUSDT, setBalances } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);

  const currentTonPrice = 6.5; 
  const totalBalanceUsd = (parseFloat(balanceUSDT) + parseFloat(balanceGRAM) * currentTonPrice).toFixed(2);

  useEffect(() => {
    const loadData = async () => {
      if (!address) return;
      setIsLoading(true);
      const newBalances = await fetchBalances(address);
      setBalances(newBalances.ton, newBalances.usdt);
      setIsLoading(false);
    };

    loadData();
  }, [address, setBalances]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 pb-10 relative"
    >
      <button 
        onClick={onSettingsClick}
        className="absolute right-0 top-0 p-2 text-zinc-500 hover:text-white transition-colors"
      >
        <Settings size={22} />
      </button>

      <div className="flex flex-col items-center justify-center mt-8">
        <span className="text-zinc-500 text-sm font-medium mb-1">Общий баланс</span>
        <h1 className="text-5xl font-bold tracking-tight text-white flex items-start gap-1">
          <span className="text-3xl mt-1 text-zinc-400">$</span>
          {isLoading && parseFloat(totalBalanceUsd) === 0 ? "..." : totalBalanceUsd}
        </h1>
      </div>

      <div className="flex items-center justify-center gap-4 mt-2">
        <button onClick={onReceiveClick} className="flex flex-col items-center gap-2 group">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
            <ArrowDownLeft size={24} />
          </div>
          <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Получить</span>
        </button>
        <button onClick={onSendClick} className="flex flex-col items-center gap-2 group">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 text-zinc-100 flex items-center justify-center border border-zinc-800 group-hover:bg-zinc-800 transition-all">
            <ArrowUpRight size={24} />
          </div>
          <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">Отправить</span>
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-white mb-4">Активы</h3>
        <div className="flex flex-col gap-3">
          <div 
            onClick={() => onAssetClick('USDT')}
            className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm cursor-pointer hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#26A17B] flex items-center justify-center">
                <span className="text-white font-bold text-sm">₮</span>
              </div>
              <div>
                <p className="text-white font-medium">Tether</p>
                <p className="text-xs text-zinc-500">USDT</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{isLoading ? "..." : balanceUSDT}</p>
              <p className="text-xs text-zinc-500">${isLoading ? "..." : balanceUSDT}</p>
            </div>
          </div>

          <div 
            onClick={() => onAssetClick('GRAM')}
            className="flex items-center justify-between bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800/50 backdrop-blur-sm cursor-pointer hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#0098EA] flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2L2 12l10 10 10-10L12 2zm0 2.83L19.17 12 12 19.17 4.83 12 12 4.83z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Toncoin</p>
                <p className="text-xs text-zinc-500">GRAM (Gas)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-medium">{isLoading ? "..." : balanceGRAM}</p>
              <p className="text-xs text-zinc-500">~${isLoading ? "..." : (parseFloat(balanceGRAM) * currentTonPrice).toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
