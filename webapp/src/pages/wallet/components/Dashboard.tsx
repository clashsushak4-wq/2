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
  currentTonPrice: number;
}

export const Dashboard = ({ onSendClick, onReceiveClick, onSettingsClick, onAssetClick, currentTonPrice }: DashboardProps) => {
  const { address, balanceGRAM, balanceUSDT, setBalances } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);

  const totalBalanceUsd = (parseFloat(balanceUSDT) + parseFloat(balanceGRAM) * currentTonPrice).toFixed(2);

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async (showLoading = false) => {
      if (!address) return;
      if (showLoading) setIsLoading(true);
      try {
        const newBalances = await fetchBalances(address);
        if (isMounted) {
          setBalances(newBalances.ton, newBalances.usdt, newBalances.price);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted && showLoading) setIsLoading(false);
      }
    };

    loadData(true);

    const interval = setInterval(() => {
      loadData(false);
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
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
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500/20 group-hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/10">
            <ArrowDownLeft size={28} />
          </div>
          <span className="text-xs md:text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">Получить</span>
        </button>
        <button onClick={onSendClick} className="flex flex-col items-center gap-2 group">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-white/5 text-zinc-100 flex items-center justify-center border border-white/10 group-hover:bg-white/10 group-hover:scale-105 active:scale-95 transition-all shadow-lg backdrop-blur-md">
            <ArrowUpRight size={28} />
          </div>
          <span className="text-xs md:text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">Отправить</span>
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold text-white mb-4">Активы</h3>
        <div className="flex flex-col gap-3">
          <div 
            onClick={() => onAssetClick('USDT')}
            className="flex items-center justify-between bg-zinc-900/50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/5 backdrop-blur-xl cursor-pointer hover:bg-zinc-800/80 hover:border-white/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="https://cryptologos.cc/logos/tether-usdt-logo.svg" alt="USDT" className="w-full h-full object-cover" />
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
            className="flex items-center justify-between bg-zinc-900/50 p-4 md:p-5 rounded-2xl md:rounded-3xl border border-white/5 backdrop-blur-xl cursor-pointer hover:bg-zinc-800/80 hover:border-white/10 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden">
                <img src="https://cryptologos.cc/logos/toncoin-ton-logo.svg" alt="GRAM" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-medium">Gram</p>
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
